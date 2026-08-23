import React, { useEffect, useState } from "react";
import { supabase } from "./src/lib/supabase";

export default function TeacherDashboard({ session, onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentType, setDocumentType] = useState("lecon");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [
      documentsResult,
      classesResult,
      subjectsResult
    ] = await Promise.all([
      supabase
        .from("documents")
        .select("*")
        .eq("teacher_id", session.user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("classes")
        .select("*")
        .order("name"),

      supabase
        .from("subjects")
        .select("*")
        .order("name")
    ]);

    if (documentsResult.data) {
      setDocuments(documentsResult.data);
    }

    if (classesResult.data) {
      setClasses(classesResult.data);
    }

    if (subjectsResult.data) {
      setSubjects(subjectsResult.data);
    }

    setLoading(false);
  }

  async function publishDocument() {
    setMessage("");

    if (!title.trim()) {
      setMessage("Veuillez saisir un titre.");
      return;
    }

    if (!classId) {
      setMessage("Veuillez choisir une classe.");
      return;
    }

    if (!subjectId) {
      setMessage("Veuillez choisir une matière.");
      return;
    }

    if (!file) {
      setMessage("Veuillez choisir un fichier.");
      return;
    }

    setUploading(true);

    try {
      const fileExtension =
        file.name.split(".").pop();

      const filePath =
        `${session.user.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } =
        await supabase.storage
          .from("school-documents")
          .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } =
        supabase.storage
          .from("school-documents")
          .getPublicUrl(filePath);

      const { error: insertError } =
        await supabase
          .from("documents")
          .insert({
            teacher_id: session.user.id,
            class_id: classId,
            subject_id: Number(subjectId),
            title: title.trim(),
            description: description.trim(),
            document_type: documentType,
            file_url: publicUrlData.publicUrl
          });

      if (insertError) {
        throw insertError;
      }

      setMessage("Document publié avec succès !");

      setTitle("");
      setDescription("");
      setDocumentType("lecon");
      setClassId("");
      setSubjectId("");
      setFile(null);
      setShowForm(false);

      await loadData();
    } catch (error) {
      console.error(error);
      setMessage(
        "Erreur : " + error.message
      );
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="center">
        Chargement de l'espace professeur…
      </div>
    );
  }

  return (
    <main className="page">
      <section className="card dashboard">

        <div className="top">
          <div>
            <p className="eyebrow">
              ÉCOLE CONNECTÉE
            </p>

            <h1>
              Espace Professeur 👨‍🏫
            </h1>

            <p>
              {session.user.email}
            </p>
          </div>

          <button
            className="secondary"
            onClick={onLogout}
          >
            Déconnexion
          </button>
        </div>

        <div className="grid">

          <div className="stat">
            <strong>
              {documents.length}
            </strong>

            <span>
              Publications
            </span>
          </div>

          <div className="stat">
            <strong>
              {classes.length}
            </strong>

            <span>
              Classes
            </span>
          </div>

          <div className="stat">
            <strong>
              {subjects.length}
            </strong>

            <span>
              Matières
            </span>
          </div>

        </div>

        <div className="notice">

          <h2>
            Publier un document
          </h2>

          <p>
            Partagez facilement vos leçons,
            exercices et interrogations avec vos élèves.
          </p>

          <button
            onClick={() => setShowForm(!showForm)}
          >
            {showForm
              ? "Fermer"
              : "+ Publier un document"}
          </button>

        </div>

        {showForm && (
          <div className="card">

            <h2>
              Nouveau document
            </h2>

            <label>
              Type de document
            </label>

            <select
              value={documentType}
              onChange={(e) =>
                setDocumentType(e.target.value)
              }
            >
              <option value="lecon">
                Leçon
              </option>

              <option value="exercice">
                Exercice
              </option>

              <option value="interrogation">
                Interrogation
              </option>

              <option value="devoir">
                Devoir
              </option>

              <option value="cours">
                Cours
              </option>

              <option value="autre">
                Autre
              </option>
            </select>

            <label>
              Classe
            </label>

            <select
              value={classId}
              onChange={(e) =>
                setClassId(e.target.value)
              }
            >
              <option value="">
                Choisir une classe
              </option>

              {classes.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>

            <label>
              Matière
            </label>

            <select
              value={subjectId}
              onChange={(e) =>
                setSubjectId(e.target.value)
              }
            >
              <option value="">
                Choisir une matière
              </option>

              {subjects.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>

            <label>
              Titre
            </label>

            <input
              type="text"
              placeholder="Ex : Les fractions"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
            />

            <label>
              Description
            </label>

            <textarea
              placeholder="Décrivez le contenu..."
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />

            <label>
              Document
            </label>

            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
            />

            <button
              onClick={publishDocument}
              disabled={uploading}
            >
              {uploading
                ? "Publication en cours..."
                : "📤 Publier"}
            </button>

            {message && (
              <p className="message">
                {message}
              </p>
            )}

          </div>
        )}

        <div className="notice">

          <h2>
            Mes publications
          </h2>

          {documents.length === 0 ? (
            <p>
              Vous n'avez encore publié aucun document.
            </p>
          ) : (
            documents.map((document) => (
              <div
                key={document.id}
                className="stat"
              >
                <strong>
                  {document.title}
                </strong>

                <span>
                  {document.document_type}
                </span>
              </div>
            ))
          )}

        </div>

      </section>
    </main>
  );
}
