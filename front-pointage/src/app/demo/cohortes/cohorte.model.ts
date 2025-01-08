export interface Cohorte {
    
    id: string; // Correspond à ObjectId de MongoDB
    nom: string;
    annee_scolaire: string;
    promo: number;
    created_at: string;
    updated_at: string;
    apprenants: Apprenant[];
   
  }
  
  interface Apprenant {
    id: string; 
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    matricule: string;
    adresse: string;
    cardId: string;
    cohorte_id: string; // Référence à l'id de la cohorte
    photo: string | null; // URL de la photo, peut être null
    role: string; // Exemple: "utilisateur_simple"
    type: string; // Exemple: "apprenant"
    selected?: boolean;
   
  }