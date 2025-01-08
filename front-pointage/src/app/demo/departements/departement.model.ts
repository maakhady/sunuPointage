export interface Departement {
    id: string;
    nom: string;
    utilisateurs: Utilisateur[];
   
  }

interface Utilisateur {

  id: string; 
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  matricule: string;
  adresse: string;
  cardId: string;
  departement_id: string; // Référence à l'id de la cohorte
  photo: string | null; // URL de la photo, peut être null
  role: string; // Exemple: "utilisateur_simple"
  type: string; // Exemple: "apprenant"
  selected?: boolean;
}