import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./src/lib/supabase";
import TeacherDashboard from "./TeacherDashboard.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import "./styles.css";

function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function loadUserRole(currentSession) {
    if (!currentSession) {
      setRole(null);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentSession.user.id)
        .single();

      if (error) {
        console.error("Erreur profil:", error);
        setRole(null);
        setMessage(
          "Impossible de récupérer votre rôle : " +
          error.message
        );
        return;
      }

      setRole(profile?.role || null);
    } catch (error) {
      console.error("Erreur récupération rôle:", error);
      setRole(null);
      setMessage(
        "Impossible de récupérer votre profil."
      );
    }
  }

  useEffect(() => {
    async function loadSession() {
      try {
        const { data, error } =
          await supabase.auth.getSession();

        if (error) {
          console.error("Erreur Supabase:", error);
          setMessage(
            "Erreur Supabase : " + error.message
          );
          return;
        }

        const currentSession = data?.session || null;

        setSession(currentSession);

        if (currentSession) {
          await loadUserRole(currentSession);
        }
      } catch (error) {
        console.error(
          "Erreur réseau Supabase:",
          error
        );

        setMessage(
          "Connexion à Supabase impossible."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);

        if (nextSession) {
          await loadUserRole(nextSession);
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signIn() {
    setMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setMessage(
        "Veuillez saisir votre adresse e-mail."
      );
      return;
    }

    try {
      const { error } =
        await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

      if (error) {
        console.error(
          "Erreur connexion:",
          error
        );

        setMessage(
          "Erreur Supabase : " + error.message
        );

        return;
      }

      setMessage(
        "Un lien de connexion a été envoyé à votre e-mail."
      );
    } catch (error) {
      console.error(
        "Erreur réseau:",
        error
      );

      setMessage(
        "Load failed : impossible de contacter Supabase."
      );
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
  }

  if (loading) {
    return (
      <div className="center">
        Chargement d'École Connectée…
      </div>
    );
  }

  if (session) {

    if (role === "admin") {
      return (
        <AdminDashboard
          session={session}
          onLogout={signOut}
        />
      );
    }

    if (role === "teacher") {
      return (
        <TeacherDashboard
          session={session}
          onLogout={signOut}
        />
      );
    }

    return (
      <main className="page">
        <section className="card login">

          <div className="logo">
            EC
          </div>

          <p className="eyebrow">
            ÉCOLE CONNECTÉE
          </p>

          <h1>
            Rôle non configuré
          </h1>

          <p className="intro">
            Votre compte est bien connecté,
            mais aucun espace n'est encore configuré
            pour votre rôle.
          </p>

          <p className="message">
            Rôle actuel : {role || "non défini"}
          </p>

          <button
            onClick={signOut}
          >
            Déconnexion
          </button>

        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card login">

        <div className="logo">
          EC
        </div>

        <p className="eyebrow">
          ÉCOLE CONNECTÉE
        </p>

        <h1>
          La sécurité et le suivi des élèves
          au cœur de l’école.
        </h1>

        <p className="intro">
          Connectez-vous pour accéder à votre espace
          Parent, Professeur, École ou Administration.
        </p>

        <label>
          Adresse e-mail
        </label>

        <input
          type="email"
          placeholder="exemple@email.com"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <button onClick={signIn}>
          Recevoir mon lien de connexion
        </button>

        {message && (
          <p className="message">
            {message}
          </p>
        )}

        <p className="small">
          Connexion sécurisée par Supabase.
        </p>

      </section>
    </main>
  );
}

createRoot(
  document.getElementById("root")
).render(
  <App />
);
