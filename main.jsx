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
    if (!currentSession?.user?.id) {
      setRole(null);
      return;
    }

    try {
      const { data, error } =
        await supabase.rpc("get_my_role");

      if (error) {
        console.error(
          "Erreur récupération rôle :",
          error
        );

        setRole(null);

        setMessage(
          "Impossible de récupérer votre rôle : " +
          error.message
        );

        return;
      }

      console.log(
        "Rôle récupéré :",
        data
      );

      setRole(data || null);
      setMessage("");

    } catch (error) {
      console.error(
        "Erreur rôle :",
        error
      );

      setRole(null);

      setMessage(
        "Impossible de récupérer votre rôle."
      );
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const {
          data,
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!mounted) {
          return;
        }

        const currentSession =
          data?.session || null;

        setSession(currentSession);

        if (currentSession) {
          await loadUserRole(
            currentSession
          );
        }

      } catch (error) {
        console.error(
          "Erreur session :",
          error
        );

        if (mounted) {
          setMessage(
            "Impossible de charger votre session."
          );
        }

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        async (_event, nextSession) => {

          if (!mounted) {
            return;
          }

          setSession(nextSession);

          if (nextSession) {
            await loadUserRole(
              nextSession
            );
          } else {
            setRole(null);
          }
        }
      );

    return () => {
      mounted = false;

      authListener.subscription.unsubscribe();
    };

  }, []);

  async function signIn() {
    setMessage("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage(
        "Veuillez saisir votre adresse e-mail."
      );

      return;
    }

    try {
      const {
        error,
      } =
        await supabase.auth.signInWithOtp({
          email: cleanEmail,

          options: {
            emailRedirectTo:
              window.location.origin,
          },
        });

      if (error) {
        setMessage(
          "Erreur Supabase : " +
          error.message
        );

        return;
      }

      setMessage(
        "Un lien de connexion a été envoyé à votre e-mail."
      );

    } catch (error) {
      console.error(error);

      setMessage(
        "Impossible de contacter Supabase."
      );
    }
  }

  async function signOut() {
    await supabase.auth.signOut();

    setSession(null);
    setRole(null);
    setMessage("");
  }

  if (loading) {
    return (
      <div className="center">
        Chargement d'École Connectée…
      </div>
    );
  }

  /*
   * ADMIN
   */

  if (session && role === "admin") {
    return (
      <AdminDashboard
        session={session}
        onLogout={signOut}
      />
    );
  }

  /*
   * PROFESSEUR
   */

  if (session && role === "teacher") {
    return (
      <TeacherDashboard
        session={session}
        onLogout={signOut}
      />
    );
  }

  /*
   * COMPTE CONNECTÉ MAIS RÔLE INCONNU
   */

  if (session) {
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
            mais votre profil n'est pas encore
            correctement configuré.
          </p>

          {message && (
            <p className="message">
              {message}
            </p>
          )}

          <p className="small">
            Rôle actuel :
            <br />
            {role || "non défini"}
          </p>

          <button onClick={signOut}>
            Déconnexion
          </button>

        </section>

      </main>
    );
  }

  /*
   * CONNEXION
   */

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
          Connectez-vous pour accéder à votre
          espace Parent, Professeur, École
          ou Administration.
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
