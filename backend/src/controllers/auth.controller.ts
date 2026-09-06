import { NextFunction, Request, Response } from "express";
import { sequelize } from "../server";
import userService from "../services/user.service";
import { UserPayload } from "../types/user.interfaces";
import { encrypt, hashAsync } from "../utils/crypto.service";
import loggerService from "../utils/logger.service";
import { sendForgotPasswordMail } from "../utils/mail.service";
import { responseMessages } from "../utils/response-message.service";
import { sendBadRequestResponse, sendServerErrorResponse, sendSuccessResponse, sendUnauthorizedResponse } from "../utils/response.service";

/** 
 * Generate a random password with specified length
 * Includes uppercase, lowercase alphabets and numbers
 */
const generatePassword = (length: number = 8): string => {
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';

    const allChars = upperCase + lowerCase + numbers;

    let password = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * allChars.length);
        password += allChars[randomIndex];
    }

    return password;
};

/**
 * Login a user
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const user = await userService.loginWithEmailAndPassword(email, password);

        if (!user) {
            return sendServerErrorResponse(res, responseMessages.authentication.loginFailed, new Error('Unknown login method'));
        }

        if ('error' in user) {
            return sendUnauthorizedResponse(res, user.error);
        }

        const token = encrypt(
            {
                userId: user.id,
                email: user.email,
            },
            '1d' // 1 day
        );

        const userResponse: Record<string, unknown> = user.toJSON();
        delete userResponse.password;

        return sendSuccessResponse(res, responseMessages.authentication.loginSuccess, {
            token,
            user: userResponse,
        });
    } catch (error) {
        loggerService.error(`Login error: ${error}`);
        sendServerErrorResponse(res, responseMessages.authentication.loginFailed, error);
        next(error);
    }
};

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
    const transaction = await sequelize.transaction();
    try {
        // Extract all fields from request body (same as update user)
        const {
            email,
            mobile,
            name,
            password
        } = req.body;

        /** Check username, email and mobile already exist or not */
        const byEmail = await userService.findUserByEmail(email);

        if (byEmail) {
            await transaction.rollback();
            return sendBadRequestResponse(res, responseMessages.user.emailAlreadyRegistered);
        }

        // Build user data object
        const userData: UserPayload = {
            email,
            mobile,
            name,
            password,
        };

        // Only hash and include password if provided
        if (password) {
            userData.password = await hashAsync(password);
        }

        // Create user
        const newUser = await userService.createUser(userData, null, transaction);

        if (!newUser) {
            await transaction.rollback();
            return sendServerErrorResponse(res, responseMessages.user.failedToCreate);
        }

        await transaction.commit();

        // Generate JWT token
        const token = encrypt({
            userId: newUser.id,
            email: newUser.email,
        }, '1d'); // 1 day

        const newUserResponse: Record<string, unknown> = newUser.toJSON ? newUser.toJSON() : { ...newUser };
        delete newUserResponse.password;

        return sendSuccessResponse(res, responseMessages.authentication.registerSuccess, {
            token,
            user: newUserResponse,
        });
    } catch (error) {
        await transaction.rollback();
        loggerService.error(`Error registering user: ${error}`);
        sendServerErrorResponse(res, responseMessages.authentication.registerFailed, error);
        next(error);
    }
};

/**
 * Forgot password
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        const user = await userService.findUserByEmail(email);
        if (!user) {
            return sendBadRequestResponse(res, responseMessages.user.notFoundSingle);
        }

        // Generate new password
        const newPassword = generatePassword(8);

        // Update user password
        await userService.updateUser(user.id, { password: await hashAsync(newPassword) });

        // Send new password to user
        sendForgotPasswordMail({
            name: user.name || '',
            email: user.email || '',
            password: newPassword,
        });

        return sendSuccessResponse(res, responseMessages.authentication.forgotPasswordSuccess);

    } catch (error) {
        loggerService.error(`Error forgot password: ${error}`);
        sendServerErrorResponse(res, responseMessages.authentication.forgotPasswordFailed, error);
        next(error);
    }
};