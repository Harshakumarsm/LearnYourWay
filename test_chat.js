// Test script to check My Sensei chat endpoint
async function testChat() {
    try {
        console.log('Testing chat endpoint with credentials...');
        
        const response = await fetch('http://localhost:3001/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ message: 'hi' })
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (response.ok) {
            const data = await response.json();
            console.log('Success! Response data:', JSON.stringify(data, null, 2));
        } else {
            const errorText = await response.text();
            console.log('Error response:', errorText);
        }
    } catch (error) {
        console.error('Network error:', error.message);
        console.error('Error details:', error);
    }
}

testChat();
