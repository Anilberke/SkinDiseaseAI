document.querySelector('form').addEventListener('submit', function (event) {
    event.preventDefault();
    const loginData = {
        email: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    fetch('http://localhost:8090/v1/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        localStorage.removeItem('access_token');
        localStorage.setItem('access_token', data.access_token);
        window.location.href = 'ConversationOptions.html';
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});