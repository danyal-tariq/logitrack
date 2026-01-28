import { VirtualTruck } from './truck';
import { DUBAI_ROUTES, getRouteByType } from './routes';
import * as dotenv from 'dotenv';
import * as colors from 'colors';

dotenv.config();

const TRUCK_COUNT = 50;
const API_URL = process.env.API_URL || 'http://localhost:4000/api';
// Tick every 2 seconds to simulate high frequent updates across many units
const REPORT_INTERVAL_MS = 2000; 

// Fleet composition by route type
const FLEET_COMPOSITION = {
    highway: 0.3,      // 30% long-haul trucks on highways
    delivery: 0.35,    // 35% delivery vehicles
    industrial: 0.20,  // 20% industrial/port trucks
    urban: 0.15        // 15% urban routes
};

async function runSimulator() {
    console.log(colors.cyan.bold(`\n🚛 Logitrack Fleet Simulator`));
    console.log(colors.cyan(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
    console.log(colors.cyan(`Fleet Size: ${TRUCK_COUNT} vehicles`));
    console.log(colors.cyan(`API Target: ${API_URL}`));
    console.log(colors.cyan(`Update Rate: ${REPORT_INTERVAL_MS}ms`));
    console.log(colors.cyan(`Available Routes: ${DUBAI_ROUTES.length}`));
    console.log(colors.cyan(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`));

    const fleet: VirtualTruck[] = [];

    // Distribute vehicles across route types based on composition
    let vehicleId = 1;
    for (const [routeType, percentage] of Object.entries(FLEET_COMPOSITION)) {
        const count = Math.floor(TRUCK_COUNT * percentage);
        console.log(colors.white(`Deploying ${count} vehicles to ${routeType} routes...`));
        
        for (let i = 0; i < count && vehicleId <= TRUCK_COUNT; i++) {
            const route = getRouteByType(routeType as 'highway' | 'delivery' | 'industrial' | 'urban');
            const truck = new VirtualTruck(vehicleId, API_URL, route);
            fleet.push(truck);
            vehicleId++;
        }
    }

    // Fill remaining slots with random routes
    while (vehicleId <= TRUCK_COUNT) {
        const truck = new VirtualTruck(vehicleId, API_URL);
        fleet.push(truck);
        vehicleId++;
    }

    console.log(colors.cyan(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
    console.log(colors.green.bold(`✅ Fleet deployed! Starting simulation...\n`));

    // Stagger vehicle start times
    fleet.forEach((truck, index) => {
        const staggerDelay = Math.floor((index / fleet.length) * REPORT_INTERVAL_MS);
        
        setTimeout(() => {
            truck.startSimulation(REPORT_INTERVAL_MS);
        }, staggerDelay);
    });

    // Log fleet status every 30 seconds
    setInterval(() => {
        console.log(colors.cyan(`\n📊 Fleet Status: ${fleet.length} vehicles active\n`));
    }, 30000);
}

runSimulator().catch(err => {
    console.error(colors.red('Simulator crashed:'), err);
});
