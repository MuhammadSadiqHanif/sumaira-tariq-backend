var firebaseConfig = {
    apiKey: "AIzaSyAlFGoZEPc0rEYAYiUTnNYZmDbnkQdP20c",
    authDomain: "todo-app-25565.firebaseapp.com",
    databaseURL: "https://todo-app-25565.firebaseio.com",
    projectId: "todo-app-25565",
    storageBucket: "",
    messagingSenderId: "600592089866",
    appId: "1:600592089866:web:1535bd7732529489"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var email;
var password;

function gettingValueSignIn() {
    email = document.getElementById("email").value;
    password = document.getElementById('password').value;
}

function signIn() {
    event.preventDefault()
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function (res) {
            console.log("hi");
            window.location.href = "addData.html"
            // getData()
        })
        .catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            alert(errorMessage)
            // ...
        })
}

var fname;
var lname;
var Age;
function todoData() {
    fname = document.getElementById('Fname').value;
    lname = document.getElementById('Lname').value;
    Age = document.getElementById('age').value;
}
function setData() {
    event.preventDefault();
    let obj = {
        name: fname,
        lastName: lname,
        age: Age
    };
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            database.ref().child(user.uid).child("wholeData").child("todoData").child(obj.name).set(obj);
            document.getElementById('Fname').value = "";
            document.getElementById('Lname').value = "";
            document.getElementById('age').value = "";
        } else {
            // No user is signed in.
        }
    });
}
function changePage() {
    window.location.href = "viewlist.html";
}
var database = firebase.database();
var email;
var password;
var number;
function personalInfo() {
    email = document.getElementById('signUpEmail').value;
    password = document.getElementById('signUpPassword').value;
    number = document.getElementById('signUpNumber').value;
}
function signUp() {
    event.preventDefault();
    let obj = {
        email: email,
        password: password,
        number: number
    }
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(function (res) {
            database.ref().child(res.user.uid).child('personal Information').set(obj)
            window.location.href = "addData.html"
            // getData();
        })
        .catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(errorMessage);
            // ...
        });
}

var table = document.getElementById('data')
function getData() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            database.ref().child(user.uid).child("wholeData").child("todoData").on('value', function (snap) {
                if (snap.val()) {
                    table.innerHTML = `            <tr>
                    <th>S no</th>
                    <th>Name</th>
                    <th>Last Name</th>
                    <th>Age</th>
                    <th><button onclick="signOut()">sign out</button></th>
                    <th><button onclick="add()">Add Data</button></th>
                    </tr>
                    `

                    var obj = Object.values(snap.val())
                    for (var i = 0; i < obj.length; i++) {
                        table.innerHTML +=
                            `<tr>
                        <td>${i + 1}</td>
                        <td>${obj[i].name}</td>
                        <td>${obj[i].lastName}</td>
                        <td>${obj[i].age}</td>
                        <td><button name = "${obj[i].name}" onclick = "del()">delete</button></td>
                        <td><button name = "${obj[i].name}" onclick = "edit()">Edit</button></td>
                        </tr>`
                    }
                } else {
                    table.innerHTML = `            <tr>
                    <th>S no</th>
                    <th>Name</th>
                    <th>Last Name</th>
                    <th>Age</th>
                    <th><button onclick="signOut()">sign out</button></th>
                    <th><button onclick="add()">Add Data</button></th>
                    </tr>
                    `

                }
            });
        } else {
            console.log("else");
        }
    });
}
function update() {
    var name = event.target.name;
    var obj = {
        name: document.getElementById('updtFname').value,
        lastName: document.getElementById('updtLname').value,
        age: document.getElementById('updtAge').value
    }
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            database.ref(user.uid).child('wholeData').child("todoData").child(name).remove();
            database.ref(user.uid).child('wholeData').child("todoData").child(obj.name).set(obj).then(() => {
                var id = document.getElementById('modalDiv');
                id.style.display = "none";

            })
        }
    })
}

function del() {

    var name = event.target.name;
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            database.ref(user.uid).child('wholeData').child("todoData").child(name).remove()
                .then(() => {
                    console.log(user.uid)
                })

        }
    })

}
function edit() {
    var name = event.target.name;
    var id = document.getElementById('modalDiv');
    id.style.display = "block";
    document.getElementById('btn').innerHTML = `<button name = "${name}" onclick = "update()">update</button>`
    document.getElementById('btn').innerHTML += `<button name = "${name}" onclick = "back()">back</button>`
    document.getElementById('updtFname').value = name
}
function back() {
    window.location.href = "viewlist.html"
}
function signOut() {

    firebase.auth().signOut().then(function () {
        window.location.href = "index.html"
    }).catch(function (error) {
        // An error happened.
    });
}
function pagechange() {
    window.location.href = "signUp.html"
}
function add() {
    window.location.href = "addData.html"

}