// Function to generate random number within a range
const getRandomNumber = (min, max) => {
    return Math.random() * (max - min) + min;
};

// Function to generate random integer within a range
const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Function to generate dummy health metrics data
const generateHealthMetrics = () => {
    const timestamp = new Date().toISOString();
    
    // Generate realistic health metrics data
    const metrics = {
        timestamp,
        device_id: "esp32Device",
        // GPS coordinates (example: New York City area)
        gps_lat: getRandomNumber(40.7128, 40.7138),
        gps_lng: getRandomNumber(-74.0060, -74.0050),
        gps_alt: getRandomNumber(0, 100),
        gps_speed: getRandomNumber(0, 5),
        
        // Temperature and humidity
        dht_temp: getRandomNumber(20, 30), // Room temperature range
        dht_hum: getRandomNumber(30, 60),  // Normal humidity range
        lm35_temp: getRandomNumber(36, 37.5), // Body temperature range
        
        // Health metrics
        spo2: getRandomInt(95, 100), // Normal SpO2 range
        bpm: getRandomInt(60, 100),  // Normal heart rate range
        
        // Accelerometer data (in m/s²)
        acc_x: getRandomNumber(-1, 1),
        acc_y: getRandomNumber(-1, 1),
        acc_z: getRandomNumber(-1, 1),
        
        // Gyroscope data (in degrees/second)
        gyro_x: getRandomNumber(-10, 10),
        gyro_y: getRandomNumber(-10, 10),
        gyro_z: getRandomNumber(-10, 10)
    };

    return metrics;
};

// Function to generate multiple data points
const generateMultipleDataPoints = (count = 10) => {
    const dataPoints = [];
    for (let i = 0; i < count; i++) {
        dataPoints.push(generateHealthMetrics());
    }
    return dataPoints;
};

// Export the functions
module.exports = {
    generateHealthMetrics,
    generateMultipleDataPoints
};

// Example usage:
// const data = generateHealthMetrics();
// console.log(JSON.stringify(data, null, 2)); 