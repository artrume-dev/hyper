// 🧪 E2E Testing Helper Script
// Run this in browser console while logged in

// Test Helper Functions
const testHelpers = {
  // Get current user token
  getToken() {
    return localStorage.getItem('auth_token');
  },

  // Get current user data
  getCurrentUser() {
    return JSON.parse(localStorage.getItem('auth-storage') || '{}').state?.user;
  },

  // Search for a user by username
  async searchUser(username) {
    const token = this.getToken();
    const response = await fetch(`http://localhost:3001/api/users/search?query=${username}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    console.log('Search results:', data);
    return data;
  },

  // Get my teams
  async getMyTeams() {
    const token = this.getToken();
    const response = await fetch('http://localhost:3001/api/teams/my-teams', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    console.log('My teams:', data);
    return data;
  },

  // Send invitation
  async sendInvitation(receiverId, teamId, role = 'MEMBER', message = 'Join our team!') {
    const token = this.getToken();
    const response = await fetch('http://localhost:3001/api/invitations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ receiverId, teamId, role, message })
    });
    const data = await response.json();
    console.log('Invitation sent:', data);
    return data;
  },

  // Get received invitations
  async getReceivedInvitations() {
    const token = this.getToken();
    const response = await fetch('http://localhost:3001/api/invitations/received', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    console.log('Received invitations:', data);
    return data;
  },

  // Get sent invitations
  async getSentInvitations() {
    const token = this.getToken();
    const response = await fetch('http://localhost:3001/api/invitations/sent', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    console.log('Sent invitations:', data);
    return data;
  },

  // Quick workflow: Send invitation to user2 from user1's first team
  async quickInviteUser2() {
    // Search for user2
    const searchResults = await this.searchUser('testuser2');
    if (!searchResults.users || searchResults.users.length === 0) {
      console.error('User testuser2 not found. Create this user first!');
      return;
    }
    const user2 = searchResults.users[0];
    console.log('Found user2:', user2);

    // Get my teams
    const teamsData = await this.getMyTeams();
    if (!teamsData.teams || teamsData.teams.length === 0) {
      console.error('No teams found. Create a team first!');
      return;
    }
    const team = teamsData.teams[0];
    console.log('Using team:', team);

    // Send invitation
    return await this.sendInvitation(
      user2.id,
      team.id,
      'MEMBER',
      'Join our awesome team!'
    );
  },

  // Print current state
  printState() {
    console.log('=== Current State ===');
    console.log('Token:', this.getToken());
    console.log('User:', this.getCurrentUser());
    console.log('===================');
  }
};

// Make it global
window.testHelpers = testHelpers;

console.log('✅ Test helpers loaded!');
console.log('Available commands:');
console.log('  testHelpers.printState()');
console.log('  testHelpers.searchUser("username")');
console.log('  testHelpers.getMyTeams()');
console.log('  testHelpers.sendInvitation(receiverId, teamId, role, message)');
console.log('  testHelpers.quickInviteUser2()');
console.log('  testHelpers.getReceivedInvitations()');
console.log('  testHelpers.getSentInvitations()');
