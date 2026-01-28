import axios from 'axios';
import * as colors from 'colors';
import { Route, Waypoint, getRandomRoute, calculateHeading, calculateDistance } from './routes';

export interface LocationUpdate {
    vehicleId: number;
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    status: 'moving' | 'idling' | 'stopped';
    version: number;
    recordedAt: string;
}

type TruckStatus = 'moving' | 'idling' | 'stopped' | 'loading' | 'unloading';

export class VirtualTruck {
    private vehicleId: number;
    private lat: number;
    private lng: number;
    private speed: number = 0; // km/h
    private targetSpeed: number = 0;
    private heading: number = 0;
    private version: number = 0;
    private apiUrl: string;
    private status: TruckStatus = 'stopped';
    
    // Route following
    private route: Route;
    private currentWaypointIndex: number = 0;
    private nextWaypointIndex: number = 1;
    private direction: 1 | -1 = 1; // 1 = forward, -1 = reverse (for loop routes)
    
    // Realistic behavior
    private stopTimer: number = 0; // seconds remaining at stop
    private idleTimer: number = 0; // random idle time
    private acceleration: number = 2.5; // m/s² (~9 km/h per second)
    private deceleration: number = 4.0; // m/s² (~14.4 km/h per second) - braking
    private progressToNextWaypoint: number = 0; // 0-1, how far along segment

    constructor(id: number, apiUrl: string, route?: Route) {
        this.vehicleId = id;
        this.apiUrl = apiUrl;
        
        // Assign route (random if not specified)
        this.route = route || getRandomRoute();
        
        // Start at a random point along the route
        this.currentWaypointIndex = Math.floor(Math.random() * this.route.waypoints.length);
        this.nextWaypointIndex = (this.currentWaypointIndex + 1) % this.route.waypoints.length;
        
        // Set initial position with slight offset to avoid vehicles stacking
        const startWaypoint = this.route.waypoints[this.currentWaypointIndex];
        const offset = (id % 10) * 0.0001; // Small offset based on vehicle ID
        this.lat = startWaypoint.lat + offset;
        this.lng = startWaypoint.lng + offset;
        
        // Calculate initial heading toward next waypoint
        const nextWaypoint = this.route.waypoints[this.nextWaypointIndex];
        this.heading = calculateHeading(startWaypoint, nextWaypoint);
        
        // Set initial speed based on route type
        this.targetSpeed = this.getTargetSpeed();
        this.speed = this.targetSpeed * 0.8; // Start slightly slower
        this.status = 'moving';
        
        // Random progress along first segment
        this.progressToNextWaypoint = Math.random() * 0.5;
        
        console.log(colors.cyan(`[${this.vehicleId}] Assigned to route: ${this.route.name} (${this.route.type})`));
    }

    /**
     * Get target speed based on current segment and conditions
     */
    private getTargetSpeed(): number {
        const currentWaypoint = this.route.waypoints[this.currentWaypointIndex];
        const baseSpeed = currentWaypoint.speedLimit;
        
        // Add some variation (±10%)
        const variation = (Math.random() * 0.2 - 0.1) * baseSpeed;
        
        // Reduce speed if approaching a stop
        const nextWaypoint = this.route.waypoints[this.nextWaypointIndex];
        if (nextWaypoint.stopDuration && this.progressToNextWaypoint > 0.7) {
            // Start slowing down when 70% to waypoint with stop
            const slowdownFactor = 1 - ((this.progressToNextWaypoint - 0.7) / 0.3) * 0.7;
            return (baseSpeed + variation) * slowdownFactor;
        }
        
        return baseSpeed + variation;
    }

    /**
     * Smooth acceleration/deceleration
     */
    private adjustSpeed(deltaSeconds: number): void {
        const speedDiff = this.targetSpeed - this.speed;
        
        if (Math.abs(speedDiff) < 1) {
            this.speed = this.targetSpeed;
            return;
        }
        
        if (speedDiff > 0) {
            // Accelerating
            this.speed += this.acceleration * 3.6 * deltaSeconds; // Convert m/s² to km/h
            this.speed = Math.min(this.speed, this.targetSpeed);
        } else {
            // Decelerating
            this.speed -= this.deceleration * 3.6 * deltaSeconds;
            this.speed = Math.max(this.speed, this.targetSpeed, 0);
        }
    }

    /**
     * Move vehicle along route
     */
    public move(deltaSeconds: number): void {
        // Handle stopped states
        if (this.status === 'stopped' || this.status === 'loading' || this.status === 'unloading') {
            if (this.stopTimer > 0) {
                this.stopTimer -= deltaSeconds;
                this.speed = 0;
                return;
            } else {
                // Resume moving
                this.status = 'moving';
                this.targetSpeed = this.getTargetSpeed();
                this.advanceToNextWaypoint();
            }
        }
        
        // Handle idling (random traffic delays)
        if (this.status === 'idling') {
            if (this.idleTimer > 0) {
                this.idleTimer -= deltaSeconds;
                this.speed = Math.max(0, this.speed - this.deceleration * 3.6 * deltaSeconds);
                return;
            } else {
                this.status = 'moving';
            }
        }
        
        // Random traffic events (1% chance per update)
        if (Math.random() < 0.01 && this.status === 'moving') {
            this.idleTimer = Math.random() * 10 + 5; // 5-15 seconds idle
            this.status = 'idling';
            this.targetSpeed = 0;
            return;
        }
        
        // Update target speed and adjust current speed
        this.targetSpeed = this.getTargetSpeed();
        this.adjustSpeed(deltaSeconds);
        
        // Calculate distance traveled
        const distanceKm = (this.speed * deltaSeconds) / 3600;
        
        // Get current segment
        const currentWaypoint = this.route.waypoints[this.currentWaypointIndex];
        const nextWaypoint = this.route.waypoints[this.nextWaypointIndex];
        const segmentDistance = calculateDistance(currentWaypoint, nextWaypoint);
        
        // Update progress along segment
        if (segmentDistance > 0) {
            this.progressToNextWaypoint += distanceKm / segmentDistance;
        }
        
        // Interpolate position along segment
        this.lat = currentWaypoint.lat + (nextWaypoint.lat - currentWaypoint.lat) * this.progressToNextWaypoint;
        this.lng = currentWaypoint.lng + (nextWaypoint.lng - currentWaypoint.lng) * this.progressToNextWaypoint;
        
        // Smoothly update heading toward next waypoint
        const targetHeading = calculateHeading(
            { lat: this.lat, lng: this.lng, name: '', speedLimit: 0 },
            nextWaypoint
        );
        this.heading = this.smoothHeading(this.heading, targetHeading, deltaSeconds);
        
        // Check if reached next waypoint
        if (this.progressToNextWaypoint >= 1.0) {
            this.arriveAtWaypoint(nextWaypoint);
        }
    }

    /**
     * Smoothly interpolate heading
     */
    private smoothHeading(current: number, target: number, deltaSeconds: number): number {
        let diff = target - current;
        
        // Handle wraparound
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        
        // Max turn rate: 45 degrees per second
        const maxTurn = 45 * deltaSeconds;
        
        if (Math.abs(diff) <= maxTurn) {
            return target;
        }
        
        return (current + Math.sign(diff) * maxTurn + 360) % 360;
    }

    /**
     * Handle arrival at waypoint
     */
    private arriveAtWaypoint(waypoint: Waypoint): void {
        console.log(colors.yellow(`[${this.vehicleId}] Arrived at: ${waypoint.name}`));
        
        // Check if this waypoint has a stop
        if (waypoint.stopDuration) {
            // Add some variation to stop duration (±20%)
            const variation = (Math.random() * 0.4 - 0.2) * waypoint.stopDuration;
            this.stopTimer = waypoint.stopDuration + variation;
            
            // Set appropriate status
            if (this.route.type === 'delivery' || this.route.type === 'industrial') {
                this.status = Math.random() > 0.5 ? 'loading' : 'unloading';
            } else {
                this.status = 'stopped';
            }
            
            console.log(colors.magenta(`[${this.vehicleId}] ${this.status} for ${Math.round(this.stopTimer)}s`));
        }
        
        this.advanceToNextWaypoint();
    }

    /**
     * Move to next waypoint in route
     */
    private advanceToNextWaypoint(): void {
        this.currentWaypointIndex = this.nextWaypointIndex;
        this.progressToNextWaypoint = 0;
        
        if (this.route.loop) {
            // Loop routes: go forward, then reverse
            this.nextWaypointIndex = this.currentWaypointIndex + this.direction;
            
            // Check bounds and reverse direction
            if (this.nextWaypointIndex >= this.route.waypoints.length) {
                this.direction = -1;
                this.nextWaypointIndex = this.route.waypoints.length - 2;
            } else if (this.nextWaypointIndex < 0) {
                this.direction = 1;
                this.nextWaypointIndex = 1;
            }
        } else {
            // Non-loop routes: reset to start
            this.nextWaypointIndex = (this.currentWaypointIndex + 1) % this.route.waypoints.length;
        }
        
        // Update target speed for new segment
        this.targetSpeed = this.getTargetSpeed();
    }

    /**
     * Get status string for API
     */
    private getApiStatus(): 'moving' | 'idling' | 'stopped' {
        if (this.status === 'loading' || this.status === 'unloading' || this.status === 'stopped') {
            return 'stopped';
        }
        return this.status;
    }

    /**
     * Report location to API
     */
    public async report(): Promise<void> {
        this.version++;
        
        const payload: LocationUpdate = {
            vehicleId: this.vehicleId,
            lat: Number(this.lat.toFixed(6)),
            lng: Number(this.lng.toFixed(6)),
            speed: Number(this.speed.toFixed(1)),
            heading: Math.floor(this.heading),
            status: this.getApiStatus(),
            version: this.version,
            recordedAt: new Date().toISOString()
        };

        try {
            await axios.post(`${this.apiUrl}/vehicle/location`, payload, {
                timeout: 5000,
                headers: { 'Content-Type': 'application/json' }
            });
            
            // Compact logging for less spam
            if (this.version % 10 === 0) { // Log every 10th update
                const routeInfo = `${this.route.name.substring(0, 15)}...`;
                console.log(colors.green(
                    `[${this.vehicleId}] ${routeInfo} | ${payload.speed.toFixed(0)} km/h | ${this.getApiStatus()}`
                ));
            }
        } catch (error: any) {
            if (error.code === 'ECONNREFUSED') {
                console.error(colors.red(`[${this.vehicleId}] Server unreachable`));
            } else {
                console.error(colors.red(`[${this.vehicleId}] Error: ${error.message}`));
            }
        }
    }

    /**
     * Start the simulation loop
     */
    public startSimulation(intervalMs: number): void {
        const deltaSeconds = intervalMs / 1000;
        
        setInterval(async () => {
            this.move(deltaSeconds);
            await this.report();
        }, intervalMs);
    }

    /**
     * Get current route info (for debugging)
     */
    public getRouteInfo(): { routeName: string; currentWaypoint: string; nextWaypoint: string } {
        return {
            routeName: this.route.name,
            currentWaypoint: this.route.waypoints[this.currentWaypointIndex].name,
            nextWaypoint: this.route.waypoints[this.nextWaypointIndex].name
        };
    }
}
