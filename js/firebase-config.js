const firebaseConfig = {
  apiKey: "AIzaSyAsJ6vqzxpi2HCG2cgCm9WpRvKGKw990u0",
  authDomain: "novedades-dpsn.firebaseapp.com",
  projectId: "novedades-dpsn",
  storageBucket: "novedades-dpsn.firebasestorage.app",
  messagingSenderId: "183094582836",
  appId: "1:183094582836:web:3bd88dc812fbdbb24af461"
};

// Inicialización (usa Firebase v9+ compat para simplicidad en GitHub Pages,
// sin necesidad de bundlers/build step)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
