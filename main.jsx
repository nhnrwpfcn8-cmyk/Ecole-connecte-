import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./src/lib/supabase";
import "./styles.css";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => setSession(nextSession)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn() {
    setMessage("");
    if (!email.trim()) {
      setMessage("Veuillez saisir votre adresse e-mail.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) setMessage(error.message);
    else setMessage("Un lien de connexion a été envoyé à votre e-mail.");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (loading) return <div className="center">Chargement d'École Connectée…</div>;

  if (!session) {
    return (
      <main className="page">
        <section className="card login">
          <div className="logo">EC</div>
          <p className="eyebrow">ÉCOLE CONNECTÉE</p>
          <h1>La sécurité et le suivi des élèves au cœur de l’école.</h1>
          <p className="intro">Connectez-vous pour accéder à votre espace.</p>
          <label>Adresse e-mail</label>
          <input type="email" placeholder="exemple@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)} />
          <button onClick={signIn}>Recevoir mon lien de connexion</button>
          {message && <p className="message">{message}</p>}
          <p className="small">Connexion sécurisée par Supabase.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card dashboard">
        <div className="top">
          <div>
            <p className="eyebrow">ÉCOLE CONNECTÉE</p>
            <h1>Bienvenue 👋</h1>
            <p>{session.user.email}</p>
          </div>
          <button className="secondary" onClick={signOut}>Déconnexion</button>
        </div>
        <div className="grid">
          <div className="stat"><strong>0</strong><span>Enfants associés</span></div>
          <div className="stat"><strong>0</strong><span>Présences aujourd'hui</span></div>
          <div className="stat"><strong>0</strong><span>Notifications</span></div>
        </div>
        <div className="notice">
          <h2>Votre espace est prêt</h2>
          <p>La connexion réelle à Supabase fonctionne. La prochaine étape sera d'afficher les élèves, les présences et les notifications liés à votre compte.</p>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
