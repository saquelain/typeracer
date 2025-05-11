const Race = require('../models/Race');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);
    
    // Join race room
    socket.on('join-race', async ({ raceId }) => {
      try {
        // Join the race room
        socket.join(`race-${raceId}`);
        console.log(`${socket.user.username} joined room race-${raceId}`);
        
        // Check if user is a participant
        const participants = await Race.getParticipants(raceId);
        const isParticipant = participants.some(p => p.user_id === socket.user.user_id);
        
        if (isParticipant) {
          socket.emit('joined-race', { raceId });
          
          // Don't emit user-joined-room here - only do it when they actually join via HTTP
          console.log(`${socket.user.username} confirmed as participant in race ${raceId}`);
        } else {
          // User is just spectating, not participating
          socket.emit('joined-race', { raceId, spectator: true });
        }
      } catch (error) {
        console.error('Join race error:', error);
        socket.emit('race-error', { message: 'Error joining race' });
      }
    });
    
    // Handle keystroke events
    socket.on('keystroke', async (data) => {
      const { raceId, keystroke } = data;
      
      try {
        // Calculate progress
        const race = await Race.findById(raceId);
        if (!race) return;
        
        const progress = calculateProgress(keystroke.position, race.sentence_content.length);
        const wpm = calculateWPM(keystroke.timestamp, keystroke.position);
        const accuracy = calculateAccuracy(keystroke.errors || 0, keystroke.position);
        
        // Update participant progress
        await Race.updateParticipantProgress(raceId, socket.user.user_id, {
          wpm,
          accuracy,
          finished: keystroke.position >= race.sentence_content.length
        });
        
        // Broadcast progress to all participants
        io.to(`race-${raceId}`).emit('participant-progress', {
          userId: socket.user.user_id,
          username: socket.user.username,
          progress,
          position: keystroke.position,
          wpm,
          accuracy
        });
        
        // Check if race should finish
        if (keystroke.position >= race.sentence_content.length) {
          const participants = await Race.getParticipants(raceId);
          const finishedCount = participants.filter(p => p.finished).length;
          
          if (finishedCount === participants.length || race.race_type === 'practice') {
            await Race.finishRace(raceId);
            const results = await Race.getRaceResults(raceId);
            
            io.to(`race-${raceId}`).emit('race-finished', {
              raceId,
              results
            });
          }
        }
      } catch (error) {
        console.error('Keystroke error:', error);
      }
    });
    
    // Leave race room
    socket.on('leave-race', ({ raceId }) => {
      socket.leave(`race-${raceId}`);
      console.log(`${socket.user.username} left room race-${raceId}`);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
      // Don't emit user-left-room on disconnect - let the HTTP endpoint handle participant leaving
    });
  });
};

// Helper functions
function calculateProgress(position, totalLength) {
  return (position / totalLength) * 100;
}

function calculateWPM(timestamp, position) {
  if (timestamp === 0) return 0;
  const minutes = timestamp / 60000;
  const wordsTyped = position / 5; // Average word length
  return Math.round(wordsTyped / minutes);
}

function calculateAccuracy(errors, totalTyped) {
  if (totalTyped === 0) return 100;
  const correct = totalTyped - errors;
  return Math.round((correct / totalTyped) * 100);
}