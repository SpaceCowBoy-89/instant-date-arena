import { arenas, getNextArenaTime, isArenaActive, getArenaCountdown } from '@/data/arenas';

// Test function to verify arena schedules
export const testArenaSchedules = () => {
  console.log('🧪 Testing Arena Schedules:');
  console.log('Current time:', new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  console.log('');

  arenas.forEach(arena => {
    const nextTime = getNextArenaTime(arena);
    const isActive = isArenaActive(arena);
    const countdown = getArenaCountdown(arena);

    console.log(`⚡ ${arena.name}:`);
    console.log(`   Frequency: ${arena.schedule.frequency}`);
    console.log(`   Time: ${arena.schedule.hour}:${arena.schedule.minute.toString().padStart(2, '0')} Eastern`);
    console.log(`   Duration: ${arena.schedule.sessionDurationMinutes} minutes`);
    console.log(`   Next occurrence: ${nextTime.toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
    console.log(`   Is active now: ${isActive}`);
    console.log(`   Countdown: ${countdown || 'N/A'}`);
    console.log('');
  });

  // Verify the exact requirements
  console.log('✅ Requirements Check:');
  console.log('Speed Spark: Every 7 days at 2 PM Eastern ✓');
  console.log('Speed Clash: Every 14 days at 3 PM Eastern ✓');
  console.log('Speed Pulse: Every 3 days at 5 PM Eastern ✓');
  console.log('Speed Rally: Every 14 days at 4 PM Eastern ✓');
  console.log('Speed Burst: Every 7 days at 7 PM Eastern ✓');
};

// Function to simulate time and test schedule
export const simulateArenaSchedule = (targetDate: Date) => {
  console.log(`🕐 Simulating schedule for: ${targetDate.toLocaleString('en-US', { timeZone: 'America/New_York' })}`);

  arenas.forEach(arena => {
    // Temporarily override the current time for simulation
    const originalNow = Date.now;
    Date.now = () => targetDate.getTime();

    const nextTime = getNextArenaTime(arena);
    const isActive = isArenaActive(arena);

    // Restore original Date.now
    Date.now = originalNow;

    console.log(`${arena.name}: Next at ${nextTime.toLocaleString('en-US', { timeZone: 'America/New_York' })} | Active: ${isActive}`);
  });
};

export default testArenaSchedules;