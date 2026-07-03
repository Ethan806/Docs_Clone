'use strict';

var email=document.querySelector('#email');
var password=document.querySelector('#password');

async function registerUser(email,password){
    try{
        const response=await fetch('http://localhost:8080/api/register',
            {
                method:'POST',headers:{'Content-Type':'application/json'},
                body:JSON.stringify({email:email,password:password})
            }
        );
        if(response.ok){
            const data=await response.json();
            console.log('Registration successful',data);
            return data;
        }
        else{
            const error = await response.text();
            console.error('❌ Registration failed:', error);
            return null;
        }
    }catch (error) {
        console.error('❌ Network error:', error);
        return null;
    }
}


 // =========================================================
// 2. SIGN IN HANDLER
// =========================================================
function handleSignIn(e) {
            e.preventDefault();
            const email = document.getElementById('signinEmail').value.trim();
            const password = document.getElementById('signinPassword').value;

            if (!email || !password) {
                alert('Please fill in both fields.');
                return;
            }

            // Simulate successful sign-in
            const successEl = document.getElementById('globalSuccess');
            successEl.textContent = `✅ Welcome back, ${email}! (Demo sign-in successful.)`;
            successEl.classList.add('show');

            // Optionally reset form
            document.getElementById('signinForm').reset();

            // In a real app, you'd send this to a backend.
            console.log('Sign In →', { email, password });
        }

// =========================================================
// 3. SIGN UP / REGISTER HANDLER
// =========================================================
function handleSignUp(e) {
            e.preventDefault();

            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;
            const confirm = document.getElementById('confirmPassword').value;
            const passError = document.getElementById('passMatchError');

            // Validate password match
            if (password !== confirm) {
                passError.classList.add('show');
                return;
            } else {
                passError.classList.remove('show');
            }

            if (!email || !password) {
                alert('Please fill in all fields.');
                return;
            }

            return registerUser(email,password);
            // Simulate successful registration
            
        }