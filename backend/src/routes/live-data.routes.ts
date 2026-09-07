import { Router, Request, Response } from 'express';

const liveDataRouter = Router();

// In-memory latest telemetry cache
let latestTelemetry = {
    deviceId: 'ESP32-NODE-01',
    voltage: 0,
    current: 0,
    power: 0,
    energy: 0,
    frequency: 0,
    powerFactor: 0,
    costPerHour: 0,
    efficiency: 100,
    gridStatus: 'OPTIMAL',
    relayState: 'ON',
    updatedAt: new Date().toISOString(),
};

// GET /api/live-data - Frontend fetches live status
liveDataRouter.get('/', (_req: Request, res: Response) => {
    res.json(latestTelemetry);
});

// POST /api/live-data - ESP32 posts telemetry
liveDataRouter.post('/', (req: Request, res: Response) => {
    const {
        voltage = 0,
        current = 0,
        power = 0,
        energy = 0,
        frequency = 50.0,
        powerFactor = 1.0,
        deviceId = 'ESP32-NODE-01',
    } = req.body;

    latestTelemetry = {
        ...latestTelemetry,
        deviceId: String(deviceId),
        voltage: Number(voltage),
        current: Number(current),
        power: Number(power),
        energy: Number(energy),
        frequency: Number(frequency),
        powerFactor: Number(powerFactor),
        updatedAt: new Date().toISOString(),
    };

    console.log(`[ESP32 Ingest] V: ${voltage}V | I: ${current}A | P: ${power}W | E: ${energy}kWh | Dev: ${deviceId}`);

    res.status(200).json({
        status: 'SUCCESS',
        message: 'Telemetry received',
        relayControl: latestTelemetry.relayState, // Allows server to command ESP32 relay (ON/OFF)
        timestamp: latestTelemetry.updatedAt,
    });
});

export default liveDataRouter;

