import "./style.css";

// Variables globales
const users = [
  {
    id: 1,
    username: "user1",
    password: "pass123",
    nom: "Thiam",
    prenom: "Lamine",
    email: "lamine@example.com",
    photo: null,
    status: "en ligne",
    lastSeen: new Date()
  },
  {
    id: 2,
    username: "user2", 
    password: "pass123",
    nom: "Ndoye",
    prenom: "Fallou",
    email: "fallou@example.com",
    photo: null,
    status: "hors ligne",
    lastSeen: new Date()
  }
];

let currentUser = null; // Pour stocker l'utilisateur connecté

let contacts = [
  {
    id: 1,
    nom: "thiam",
    prenom: "lamine",
    numero: "773456765",
  },
  {
    id: 2,
    nom: "ndoye",
    prenom: "fallou",
    numero: "773056365",
  },
  {
    id: 3,
    nom: "fall",
    prenom: "aliou",
    numero: "773445765",
  },
  {
    id: 4,
    nom: "sene",
    prenom: "alpha",
    numero: "773487765",
  },
  {
    id: 5,
    nom: "ba",
    prenom: "amadou",
    numero: "773454765",
  },
];

let groupes = [
  {
    id: 1,
    nom: "Famille",
    description: "Groupe familial",
    membres: [1, 2],
    admin: 1,
  },
  {
    id: 2,
    nom: "Travail",
    description: "Équipe de travail",
    membres: [3, 4],
    admin: 3,
  },
];

let messages = {
  contacts: {},
  groupes: {}
};

let archives = {
  contacts: [],
  groupes: []
};

let contactsSelectionnes = [];
let currentView = "messages";
let selectedContact = null;
let selectedGroupe = null;
let currentGroupeGestion = null;

// Initialiser les messages par défaut
contacts.forEach(contact => {
  messages.contacts[contact.id] = [
    {
      id: Date.now() + Math.random(),
      texte: "Salut ! Comment ça va ?",
      expediteur: "moi",
      timestamp: new Date(Date.now() - 3600000),
      lu: true
    }
  ];
});

groupes.forEach(groupe => {
  messages.groupes[groupe.id] = [
    {
      id: Date.now() + Math.random(),
      texte: "Bienvenue dans le groupe !",
      expediteur: "système",
      timestamp: new Date(Date.now() - 7200000),
      lu: true
    }
  ];
});

// Éléments DOM
const buttonNouveau = document.getElementById("bouton-nouveau");
const modal = document.getElementById("modal");
const closeBtn = document.getElementById("closeModal");
const modalContent = document.getElementById("modalContent");
const buttonGroupe = document.getElementById("bouton-groupe");
const modalGroupe = document.getElementById("modal-groupe");
const closeBtnGroupe = document.getElementById("closeModal-groupe");
const modalContentGroupe = document.getElementById("modalContent-groupe");
const contactForm = document.getElementById("contactForm");
const groupForm = document.getElementById("groupForm");
const contentSection = document.getElementById("content-section");
const buttonDiffusion = document.getElementById("button-diffusion");
const boutonGroupeAffich = document.getElementById("bouton-groupe-affich");
const btnMessages = document.getElementById("btn-messages");
const btnArchives = document.getElementById("btn-archives");
const sectionTitle = document.getElementById("section-title");
const textSearch = document.getElementById("text-search");
const btnDiffusionAction = document.getElementById("btn-diffusion-action");
const modalDiffusion = document.getElementById("modal-diffusion");
const modalGestionGroupe = document.getElementById("modal-gestion-groupe");
const modalGestionMembres = document.getElementById("modal-gestion-membres");

// Fonction pour obtenir les initiales
function getInitials(prenom, nom) {
  return (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
}

// Fonction pour générer une couleur d'avatar basée sur le nom
function getAvatarColor(nom) {
  const colors = [
    "bg-red-400",
    "bg-blue-400",
    "bg-green-400",
    "bg-yellow-400",
    "bg-purple-400",
    "bg-pink-400",
    "bg-indigo-400",
    "bg-teal-400",
  ];
  let hash = 0;
  for (let i = 0; i < nom.length; i++) {
    hash = nom.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Fonction pour trouver un contact par ID
function trouverContact(id) {
  return contacts.find(c => c.id === id);
}

// Fonction pour trouver un groupe par ID
function trouverGroupe(id) {
  return groupes.find(g => g.id === id);
}

// Fonction pour valider un nouveau contact
function validerNouveauContact(nom, prenom, numero) {
  // Validation du numéro (uniquement chiffres)
  if (!/^\d+$/.test(numero)) {
    return { valide: false, erreur: "Le numéro doit contenir uniquement des chiffres." };
  }

  // Vérifier doublons téléphone
  if (contacts.some(c => c.numero === numero)) {
    return { valide: false, erreur: "Ce numéro de téléphone existe déjà." };
  }

  // Vérifier nom + prénom identiques
  let nomComplet = `${prenom} ${nom}`;
  let compteur = 2;
  
  while (contacts.some(c => `${c.prenom} ${c.nom}` === nomComplet)) {
    nomComplet = `${prenom} ${nom} ${compteur}`;
    compteur++;
  }

  if (nomComplet !== `${prenom} ${nom}`) {
    const parts = nomComplet.split(' ');
    return { 
      valide: true, 
      nom: parts.slice(1, -1).join(' '), 
      prenom: parts[0], 
      suffixe: parts[parts.length - 1]
    };
  }

  return { valide: true, nom, prenom };
}

// Fonction pour obtenir le dernier message
function getDernierMessage(type, id) {
  const msgs = type === 'contact' ? messages.contacts[id] : messages.groupes[id];
  if (!msgs || msgs.length === 0) return { texte: "Aucun message", timestamp: new Date() };
  return msgs[msgs.length - 1];
}

// Fonction pour créer un élément contact
function creerContact(contact, isDiffusion = false, isArchive = false) {
  const initials = getInitials(contact.prenom, contact.nom);
  const avatarColor = getAvatarColor(contact.nom);
  const dernierMsg = getDernierMessage('contact', contact.id);
  const estLu = dernierMsg.lu;
  
  const checkboxHtml = isDiffusion ? 
    `<input type="checkbox" class="contact-checkbox mr-3" data-id="${contact.id}" />` : '';
  
  const unarchiveBtn = isArchive ? 
    `<button class="unarchive-btn text-blue-500 hover:text-blue-700 ml-2" data-type="contact" data-id="${contact.id}">
      <i class="fas fa-undo"></i>
    </button>` : '';

  return `
    <div class="contact-item flex items-center p-3 hover:bg-gray-200 cursor-pointer rounded-lg transition-colors duration-200" 
         data-type="contact" data-id="${contact.id}">
        ${checkboxHtml}
      <div class="w-12 h-12 ${avatarColor} rounded-full flex items-center justify-center mr-3">
        <span class="text-white font-semibold text-sm">${initials}</span>
      </div>
      <div class="flex-1">
        <div class="flex justify-between items-center">
          <h3 class="font-semibold text-gray-800">${contact.prenom} ${contact.nom}</h3>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">${formatTime(dernierMsg.timestamp)}</span>
            <div class="w-3 h-3 rounded-full ${estLu ? 'bg-gray-400' : 'bg-green-500'}"></div>
            ${unarchiveBtn}
          </div>
        </div>
        <p class="text-sm text-gray-600 truncate items-end">${dernierMsg.texte}</p>
        
      </div>
    </div>
  `;
}

// Fonction pour créer un élément groupe
function creerGroupe(groupe, isArchive = false) {
  const initials = groupe.nom.substring(0, 2).toUpperCase();
  const avatarColor = getAvatarColor(groupe.nom);
  const dernierMsg = getDernierMessage('groupe', groupe.id);
  const estLu = dernierMsg.lu;
  
  const unarchiveBtn = isArchive ? 
    `<button class="unarchive-btn text-blue-500 hover:text-blue-700 ml-2" data-type="groupe" data-id="${groupe.id}">
      <i class="fas fa-undo"></i>
    </button>` : '';

  return `
    <div class="groupe-item flex items-center p-3 hover:bg-gray-200 cursor-pointer rounded-lg transition-colors duration-200"
         data-type="groupe" data-id="${groupe.id}">
      <div class="w-12 h-12 ${avatarColor} rounded-full flex items-center justify-center mr-3">
        <span class="text-white font-semibold text-sm">${initials}</span>
      </div>
      <div class="flex-1">
        <div class="flex justify-between items-center">
          <h3 class="font-semibold text-gray-800">${groupe.nom}</h3>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">${formatTime(dernierMsg.timestamp)}</span>
            <div class="w-3 h-3 rounded-full ${estLu ? 'bg-gray-400' : 'bg-green-500'}"></div>
            ${unarchiveBtn}
          </div>
        </div>
        <p class="text-sm text-gray-600">${groupe.membres.length} membres</p>
      </div>
    </div>
  `;
}

// Fonction pour formater l'heure
function formatTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) return diffDays === 1 ? 'Hier' : `${diffDays}j`;
  if (diffHours > 0) return `${diffHours}h`;
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Fonction pour rechercher
function rechercherContacts(terme) {
  terme = terme.toLowerCase().trim();
  
  // Cas spécial: afficher tous les contacts si "*" est saisi
  if (terme === "*") {
    return { 
      contacts: contacts.sort((a, b) => {
        const nomA = `${a.prenom} ${a.nom}`.toLowerCase();
        const nomB = `${b.prenom} ${b.nom}`.toLowerCase();
        return nomA.localeCompare(nomB);
      }), 
      groupes: [] 
    };
  }
  
  // Comportement normal pour les autres recherches
  if (!terme) return { contacts: contacts, groupes: groupes };
  
  const contactsFiltres = contacts.filter(c => 
    c.nom.toLowerCase().includes(terme) || 
    c.prenom.toLowerCase().includes(terme) || 
    c.numero.includes(terme)
  );
  
  const groupesFiltres = groupes.filter(g => 
    g.nom.toLowerCase().includes(terme)
  );
  
  return { contacts: contactsFiltres, groupes: groupesFiltres };
}

// Fonction pour afficher les contacts
function afficherContacts() {
  const terme = textSearch.value;
  const resultats = rechercherContacts(terme);
  
  // Trier par ordre alphabétique (prénom + nom)
  const contactsTries = resultats.contacts.sort((a, b) => {
    const nomA = `${a.prenom} ${a.nom}`.toLowerCase();
    const nomB = `${b.prenom} ${b.nom}`.toLowerCase();
    return nomA.localeCompare(nomB);
  });
  
  contentSection.innerHTML = "";
  contactsTries.forEach((contact) => {
    if (!archives.contacts.includes(contact.id)) {
      contentSection.innerHTML += creerContact(contact);
    }
  });
  addContactClickListeners();
}

// Fonction pour afficher les diffusions
function afficherDiffusions() {
  contentSection.innerHTML = "";
  btnDiffusionAction.classList.remove("hidden");
  
  contacts.forEach((contact) => {
    if (!archives.contacts.includes(contact.id)) {
      contentSection.innerHTML += creerContact(contact, true);
    }
  });
  
  // Event listeners pour les checkboxes
  document.querySelectorAll('.contact-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const contactId = parseInt(e.target.dataset.id);
      if (e.target.checked) {
        if (!contactsSelectionnes.includes(contactId)) {
          contactsSelectionnes.push(contactId);
        }
      } else {
        contactsSelectionnes = contactsSelectionnes.filter(id => id !== contactId);
      }
      updateNbDestinataires();
    });
  });
}

// Fonction pour afficher les groupes
function afficherGroupes() {
  const terme = textSearch.value;
  const resultats = rechercherContacts(terme);
  
  contentSection.innerHTML = "";
  resultats.groupes.forEach((groupe) => {
    if (!archives.groupes.includes(groupe.id)) {
      contentSection.innerHTML += creerGroupe(groupe);
    }
  });
  addGroupeClickListeners();
}

// Fonction pour afficher les discussions (mélange contacts et groupes)
function afficherDiscussions() {
  const terme = textSearch.value;
  const resultats = rechercherContacts(terme);
  
  contentSection.innerHTML = "";

  // Mélanger et trier par dernier message
  const tousLesElements = [];
  
  resultats.contacts.forEach(contact => {
    if (!archives.contacts.includes(contact.id)) {
      const dernierMsg = getDernierMessage('contact', contact.id);
      tousLesElements.push({
        type: 'contact',
        data: contact,
        timestamp: dernierMsg.timestamp
      });
    }
  });
  
  resultats.groupes.forEach(groupe => {
    if (!archives.groupes.includes(groupe.id)) {
      const dernierMsg = getDernierMessage('groupe', groupe.id);
      tousLesElements.push({
        type: 'groupe',
        data: groupe,
        timestamp: dernierMsg.timestamp
      });
    }
  });
  
  // Trier par timestamp décroissant
  tousLesElements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  tousLesElements.forEach(element => {
    if (element.type === 'contact') {
      contentSection.innerHTML += creerContact(element.data);
    } else {
      contentSection.innerHTML += creerGroupe(element.data);
    }
  });

  addContactClickListeners();
  addGroupeClickListeners();
}

// Fonction pour afficher les archives
function afficherArchives() {
  contentSection.innerHTML = "";
  
  archives.contacts.forEach(contactId => {
    const contact = trouverContact(contactId);
    if (contact) {
      contentSection.innerHTML += creerContact(contact, false, true);
    }
  });
  
  archives.groupes.forEach(groupeId => {
    const groupe = trouverGroupe(groupeId);
    if (groupe) {
      contentSection.innerHTML += creerGroupe(groupe, true);
    }
  });
  
  addContactClickListeners();
  addGroupeClickListeners();
  addUnarchiveListeners();
}

// Fonction pour désarchiver
function addUnarchiveListeners() {
  document.querySelectorAll('.unarchive-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = e.currentTarget.dataset.type;
      const id = parseInt(e.currentTarget.dataset.id);
      
      if (type === 'contact') {
        archives.contacts = archives.contacts.filter(cId => cId !== id);
      } else {
        archives.groupes = archives.groupes.filter(gId => gId !== id);
      }
      
      afficherArchives();
      showNotification(`${type === 'contact' ? 'Contact' : 'Groupe'} désarchivé !`);
    });
  });
}

// Ajouter les event listeners pour les contacts
function addContactClickListeners() {
  document.querySelectorAll(".contact-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains('contact-checkbox') || e.target.classList.contains('unarchive-btn')) {
        return;
      }
      
      const contactId = parseInt(item.dataset.id);
      const contact = trouverContact(contactId);
      
      if (!contact) return;
      
      selectedContact = contact;
      selectedGroupe = null;
      
      // Mettre à jour l'en-tête de discussion
      updateDiscussionHeader(contact, 'contact');
      
      // Afficher les messages du contact
      afficherMessages('contact', contactId);
      
      // Afficher les boutons appropriés
      document.getElementById('contact-actions').classList.remove('hidden');
      document.getElementById('group-actions').classList.add('hidden');
    });
  });
}

// Ajouter les event listeners pour les groupes
function addGroupeClickListeners() {
  document.querySelectorAll(".groupe-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains('unarchive-btn')) {
        return;
      }
      
      const groupeId = parseInt(item.dataset.id);
      const groupe = trouverGroupe(groupeId);
      
      if (!groupe) return;
      
      selectedGroupe = groupe;
      selectedContact = null;
      
      // Mettre à jour l'en-tête de discussion
      updateDiscussionHeader(groupe, 'groupe');
      
      // Afficher les messages du groupe
      afficherMessages('groupe', groupeId);
      
      // Afficher les boutons appropriés
      document.getElementById('group-actions').classList.remove('hidden');
      document.getElementById('contact-actions').classList.add('hidden');
    });
  });
}

// Fonction pour mettre à jour l'en-tête de discussion
function updateDiscussionHeader(item, type) {
  const contactName = document.getElementById("contact-name");
  const contactStatus = document.getElementById("contact-status");
  const contactInitials = document.getElementById("contact-initials");
  const contactAvatar = document.getElementById("contact-avatar");
  const membresGroupe = document.getElementById("membres-groupe");
  
  if (type === 'contact') {
    contactName.textContent = `${item.prenom} ${item.nom}`;
    contactStatus.textContent = item.numero;
    contactInitials.textContent = getInitials(item.prenom, item.nom);
    contactAvatar.className = `w-12 h-12 ${getAvatarColor(item.nom)} rounded-full flex items-center justify-center`;
    membresGroupe.innerHTML = '';
  } else {
    contactName.textContent = item.nom;
    contactStatus.textContent = item.description;
    contactInitials.textContent = item.nom.substring(0, 2).toUpperCase();
    contactAvatar.className = `w-12 h-12 ${getAvatarColor(item.nom)} rounded-full flex items-center justify-center`;
    
    // Afficher les membres du groupe
    membresGroupe.innerHTML = '';
    item.membres.forEach(membreId => {
      const membre = trouverContact(membreId);
      if (membre) {
        const membreSpan = document.createElement('span');
        membreSpan.className = 'bg-gray-200 px-2 py-1 rounded-full text-xs';
        membreSpan.textContent = `${membre.prenom} ${membre.nom}`;
        membresGroupe.appendChild(membreSpan);
      }
    });
  }
}

// Fonction pour afficher les messages
function afficherMessages(type, id) {
  const contentDiscussions = document.querySelector(".content-discussions");
  const msgs = type === 'contact' ? messages.contacts[id] : messages.groupes[id];
  
  if (!msgs || msgs.length === 0) {
    contentDiscussions.innerHTML = `
      <div class="flex flex-col justify-end h-full">
        <div class="text-center mb-4">
          <i class="fas fa-comment-dots text-6xl mb-4 opacity-50"></i>
          <p class="text-lg">Aucun message dans cette conversation</p>
        </div>
      </div>
    `;
    return;
  }
  
  contentDiscussions.innerHTML = `
    <div class="flex flex-col justify-end min-h-full p-4 w-full">
      <div class="flex flex-col space-y-3">
        ${msgs.map(msg => `
          <div class="flex ${msg.expediteur === 'moi' ? 'justify-end' : 'justify-start'} w-full">
            <div class="max-w-[60%] ${msg.expediteur === 'moi' ? 'ml-auto' : ''}">
              <div class="${msg.expediteur === 'moi' ? 'bg-[#3dce40] text-white' : 'bg-white text-black'} p-3 rounded-lg shadow-sm">
                ${msg.expediteur !== 'moi' && type === 'groupe' ? 
                  `<div class="text-xs font-semibold text-blue-600 mb-1">${msg.expediteur}</div>` : ''}
                <p class="text-sm">${msg.texte}</p>
                <div class="flex justify-end items-center mt-1">
                  <span class="text-xs ${msg.expediteur === 'moi' ? 'text-white/70' : 'text-gray-500'}">${formatTime(msg.timestamp)}</span>
                  ${msg.expediteur === 'moi' ? 
                    `<i class="fas fa-check${msg.lu ? '-double text-white/70' : ' text-white/70'} text-xs ml-2"></i>` : ''}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  // Marquer tous les messages comme lus
  msgs.forEach(msg => msg.lu = true);
  
  // Scroll vers le bas
  contentDiscussions.scrollTop = contentDiscussions.scrollHeight;
}

// Fonction pour envoyer un message
function envoyerMessage(texte) {
  if (!texte.trim()) return;
  
  const nouveauMessage = {
    id: Date.now() + Math.random(),
    texte: texte.trim(),
    expediteur: 'moi', // Important: utiliser 'moi' pour identifier vos messages
    timestamp: new Date(),
    lu: false
  };
  
  if (selectedContact) {
    if (!messages.contacts[selectedContact.id]) {
      messages.contacts[selectedContact.id] = [];
    }
    messages.contacts[selectedContact.id].push(nouveauMessage);
    afficherMessages('contact', selectedContact.id);
  } else if (selectedGroupe) {
    if (!messages.groupes[selectedGroupe.id]) {
      messages.groupes[selectedGroupe.id] = [];
    }
    messages.groupes[selectedGroupe.id].push(nouveauMessage);
    afficherMessages('groupe', selectedGroupe.id);
  }
}

function peuplerSelectionMembres() {
  const membresSelection = document.getElementById('membres-selection');
  membresSelection.innerHTML = '';
  
  contacts.forEach(contact => {
    membresSelection.innerHTML += `
      <label class="flex items-center space-x-2 cursor-pointer">
        <input type="checkbox" class="membre-checkbox" data-id="${contact.id}" />
        <span class="text-sm">${contact.prenom} ${contact.nom}</span>
      </label>
    `;
  });
}

// Fonction pour mettre à jour le nombre de destinataires
function updateNbDestinataires() {
  document.getElementById('nb-destinataires').textContent = contactsSelectionnes.length;
}

// Event listeners pour la navigation

function updateGroupButtonVisibility() {
  if (currentView === "groupes") {
    buttonGroupe.classList.remove("hidden");
  } else {
    buttonGroupe.classList.add("hidden");
  }
}

btnMessages.addEventListener("click", () => {
  currentView = "messages";
  sectionTitle.textContent = "Discussions";
  btnDiffusionAction.classList.add("hidden");
  contactsSelectionnes = [];
  updateActiveButton("messages");
  updateGroupButtonVisibility(); 
  afficherDiscussions();
});

buttonDiffusion.addEventListener("click", () => {
  currentView = "diffusions";
  sectionTitle.textContent = "Diffusions";
  contactsSelectionnes = [];
  updateActiveButton("diffusions");
  updateGroupButtonVisibility(); 
  afficherDiffusions();
});

boutonGroupeAffich.addEventListener("click", () => {
  currentView = "groupes";
  sectionTitle.textContent = "Groupes";
  btnDiffusionAction.classList.add("hidden");
  contactsSelectionnes = [];
  updateActiveButton("groupes");
  updateGroupButtonVisibility(); 
  afficherGroupes();
});

btnArchives.addEventListener("click", () => {
  currentView = "archives";
  sectionTitle.textContent = "Archives";
  btnDiffusionAction.classList.add("hidden");
  contactsSelectionnes = [];
  updateActiveButton("archives");
  updateGroupButtonVisibility(); 
  afficherArchives();
});

// Event listener pour la recherche
textSearch.addEventListener('input', () => {
  switch(currentView) {
    case 'messages':
      afficherDiscussions();
      break;
    case 'diffusions':
      afficherDiffusions();
      break;
    case 'groupes':
      afficherGroupes();
      break;
    case 'archives':
      afficherArchives();
      break;
  }
});

// Fonction pour mettre à jour le bouton actif
function updateActiveButton(activeView) {
  document.querySelectorAll("aside button").forEach((btn) => {
    btn.classList.remove("bg-[#d9caa3]");
  });

  let activeButton;
  switch (activeView) {
    case "messages":
      activeButton = btnMessages;
      break;
    case "diffusions":
      activeButton = buttonDiffusion;
      break;
    case "groupes":
      activeButton = boutonGroupeAffich;
      break;
    case "archives":
      activeButton = btnArchives;
      break;
  }

  if (activeButton) {
    activeButton.classList.add("bg-[#d9caa3]");
  }
}

// Event listeners pour les modals
buttonNouveau.addEventListener("click", () => {
  modal.classList.remove("hidden");
  setTimeout(() => {
    modalContent.classList.remove("scale-75", "opacity-0");
    modalContent.classList.add("scale-100", "opacity-100");
  }, 10);
});

closeBtn.addEventListener("click", () => {
  modalContent.classList.remove("scale-100", "opacity-100");
  modalContent.classList.add("scale-75", "opacity-0");
  setTimeout(() => {
    modal.classList.add("hidden");
    contactForm.reset();
  }, 300);
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeBtn.click();
  }
});

buttonGroupe.addEventListener("click", () => {
  peuplerSelectionMembres();
  modalGroupe.classList.remove("hidden");
  setTimeout(() => {
    modalContentGroupe.classList.remove("scale-90", "opacity-0");
    modalContentGroupe.classList.add("scale-100", "opacity-100");
  }, 10);
});

closeBtnGroupe.addEventListener("click", () => {
  modalContentGroupe.classList.remove("scale-100", "opacity-100");
  modalContentGroupe.classList.add("scale-90", "opacity-0");
  setTimeout(() => {
    modalGroupe.classList.add("hidden");
    groupForm.reset();
  }, 300);
});

modalGroupe.addEventListener("click", (e) => {
  if (e.target === modalGroupe) {
    closeBtnGroupe.click();
  }
});

// Event listener pour ajouter un contact
contactForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const inputNom = document.querySelector(".input-nom");
  const inputPrenom = document.querySelector(".input-prenom");
  const inputNumero = document.querySelector(".input-numero");

  if (!inputNom.value.trim() || !inputPrenom.value.trim() || !inputNumero.value.trim()) {
    showNotification("Veuillez remplir tous les champs", 'warning');
    return;
  }

  const validation = validerNouveauContact(
    inputNom.value.trim(),
    inputPrenom.value.trim(),
    inputNumero.value.trim()
  );

  if (!validation.valide) {
    showNotification(validation.erreur, 'error');
    return;
  }

  const newContact = {
    id: Date.now(),
    nom: validation.nom,
    prenom: validation.prenom + (validation.suffixe ? ` ${validation.suffixe}` : ''),
    numero: inputNumero.value.trim(),
  };

  contacts.push(newContact);
  messages.contacts[newContact.id] = [];
  closeBtn.click();

  switch(currentView) {
    case "diffusions":
      afficherDiffusions();
      break;
    case "messages":
      afficherDiscussions();
      break;
  }

  showNotification("Contact ajouté avec succès !");
});

// Event listener pour ajouter un groupe
groupForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const inputNomGroupe = document.querySelector(".input-nom-groupe");
  const inputDescription = document.querySelector(".input-description");
  const membresSelectionnes = Array.from(document.querySelectorAll('.membre-checkbox:checked'))
    .map(cb => parseInt(cb.dataset.id));

  if (!inputNomGroupe.value.trim()) {
    showNotification("Veuillez entrer un nom pour le groupe", 'warning');
    return;
  }

  if (membresSelectionnes.length < 1) {
    showNotification("Veuillez sélectionner au moins 1 membre (vous serez automatiquement ajouté)", 'warning');
    return;
  }

  // Ajouter "vous" automatiquement (simulé par le premier contact pour la démo)
  const membresFinaux = [contacts[0].id, ...membresSelectionnes.filter(id => id !== contacts[0].id)];

  const newGroupe = {
    id: Date.now(),
    nom: inputNomGroupe.value.trim(),
    description: inputDescription.value.trim() || "Nouveau groupe",
    membres: membresFinaux,
    admin: contacts[0].id // "Vous" êtes admin par défaut
  };

  groupes.push(newGroupe);
  messages.groupes[newGroupe.id] = [];
  closeBtnGroupe.click();

  if (currentView === "groupes") {
    afficherGroupes();
  } else if (currentView === "messages") {
    afficherDiscussions();
  }

  showNotification("Groupe créé avec succès ! Vous êtes l'administrateur.");
});

// Event listeners pour les actions de diffusion
btnDiffusionAction.addEventListener('click', () => {
    if (contactsSelectionnes.length === 0) {
        showNotification('Veuillez sélectionner au moins un destinataire', 'warning');
        return;
    }
    modalDiffusion.classList.remove('hidden');
    updateNbDestinataires();
});

document.getElementById('send-diffusion').addEventListener('click', () => {
    const message = document.getElementById('message-diffusion').value.trim();
    if (!message) {
        showNotification('Veuillez saisir un message', 'warning');
        return;
    }
    
    const nbDestinataires = contactsSelectionnes.length;
    
    contactsSelectionnes.forEach(contactId => {
        if (!messages.contacts[contactId]) {
            messages.contacts[contactId] = [];
        }
        messages.contacts[contactId].push({
            id: Date.now() + Math.random(),
            texte: message,
            expediteur: 'moi',
            timestamp: new Date(),
            lu: false
        });
    });
    
    modalDiffusion.classList.add('hidden');
    document.getElementById('message-diffusion').value = '';
    
    document.querySelectorAll('.contact-checkbox').forEach(cb => cb.checked = false);
    contactsSelectionnes = [];
    updateNbDestinataires();
    
    showNotification(`Diffusion envoyée à ${nbDestinataires} contacts !`);
});

// Annuler la diffusion
document.getElementById('cancel-diffusion').addEventListener('click', () => {
    modalDiffusion.classList.add('hidden');
    document.getElementById('message-diffusion').value = '';
    document.querySelectorAll('.contact-checkbox').forEach(cb => cb.checked = false);
    contactsSelectionnes = [];
    updateNbDestinataires();
});

// Event listeners pour la gestion des groupes
document.getElementById('btn-gerer-groupe').addEventListener('click', () => {
  if (selectedGroupe) {
    currentGroupeGestion = selectedGroupe;
    modalGestionGroupe.classList.remove('hidden');
  }
});

document.getElementById('close-gestion-groupe').addEventListener('click', () => {
  modalGestionGroupe.classList.add('hidden');
});

// Event listeners pour les actions sur les groupes
document.getElementById('btn-ajouter-membre').addEventListener('click', () => {
  afficherGestionMembres('ajouter');
});

document.getElementById('btn-supprimer-membre').addEventListener('click', () => {
  afficherGestionMembres('supprimer');
});

document.getElementById('btn-archiver-groupe').addEventListener('click', () => {
  if (currentGroupeGestion && !archives.groupes.includes(currentGroupeGestion.id)) {
    archives.groupes.push(currentGroupeGestion.id);
    modalGestionGroupe.classList.add('hidden');
    
    if (currentView === 'groupes') afficherGroupes();
    else if (currentView === 'messages') afficherDiscussions();
    
    showNotification('Groupe archivé !');
  }
});

document.getElementById('btn-supprimer-groupe').addEventListener('click', () => {
  if (currentGroupeGestion) {
    showConfirmDialog(
      'Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible.',
      () => {
        groupes = groupes.filter(g => g.id !== currentGroupeGestion.id);
        delete messages.groupes[currentGroupeGestion.id];
        modalGestionGroupe.classList.add('hidden');
        
        if (currentView === 'groupes') afficherGroupes();
        else if (currentView === 'messages') afficherDiscussions();
        
        resetDiscussionView();
        showNotification('Groupe supprimé !');
      }
    );
  }
});

// Event listeners pour les actions sur les contacts
document.getElementById('btn-supprimer-contact').addEventListener('click', () => {
  if (selectedContact) {
    showConfirmDialog(
      'Êtes-vous sûr de vouloir supprimer ce contact ? Cette action est irréversible.',
      () => {
        contacts = contacts.filter(c => c.id !== selectedContact.id);
        delete messages.contacts[selectedContact.id];
        
        if (currentView === 'diffusions') afficherDiffusions();
        else if (currentView === 'messages') afficherDiscussions();
        
        resetDiscussionView();
        showNotification('Contact supprimé !');
      }
    );
  }
});

document.getElementById('btn-bloquer-contact').addEventListener('click', () => {
  if (selectedContact) {
    showNotification('Contact bloqué !');
  }
});

// Event listeners pour les actions communes
document.getElementById('btn-archiver-conversation').addEventListener('click', () => {
  if (selectedContact && !archives.contacts.includes(selectedContact.id)) {
    archives.contacts.push(selectedContact.id);
    if (currentView === 'messages') afficherDiscussions();
    resetDiscussionView();
    showNotification('Conversation archivée !');
  } else if (selectedGroupe && !archives.groupes.includes(selectedGroupe.id)) {
    archives.groupes.push(selectedGroupe.id);
    if (currentView === 'messages') afficherDiscussions();
    resetDiscussionView();
    showNotification('Conversation archivée !');
  }
});

document.getElementById('btn-supprimer-discussion').addEventListener('click', () => {
  const message = selectedContact ? 
    'Êtes-vous sûr de vouloir supprimer cette discussion ?' : 
    'Êtes-vous sûr de vouloir supprimer cette discussion de groupe ?';
  
  showConfirmDialog(message, () => {
    if (selectedContact) {
      messages.contacts[selectedContact.id] = [];
      afficherMessages('contact', selectedContact.id);
    } else if (selectedGroupe) {
      messages.groupes[selectedGroupe.id] = [];
      afficherMessages('groupe', selectedGroupe.id);
    }
    showNotification('Discussion supprimée !');
  });
});

// Event listener pour l'envoi de messages
document.getElementById('btn-send-message').addEventListener('click', () => {
  const input = document.getElementById('input-message');
  envoyerMessage(input.value);
  input.value = '';
});

document.getElementById('input-message').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('btn-send-message').click();
  }
});

// Fonction pour réinitialiser la vue de discussion
function resetDiscussionView() {
  selectedContact = null;
  selectedGroupe = null;
  
  document.getElementById('contact-name').textContent = 'Sélectionnez un contact';
  document.getElementById('contact-status').textContent = '--';
  document.getElementById('contact-initials').textContent = '--';
  document.getElementById('contact-avatar').className = 'w-12 h-12 bg-[#d9caa3] rounded-full flex items-center justify-center';
  document.getElementById('membres-groupe').innerHTML = '';
  
  document.getElementById('contact-actions').classList.add('hidden');
  document.getElementById('group-actions').classList.add('hidden');
  
  document.querySelector('.content-discussions').innerHTML = `
    <div class="flex items-center justify-center h-full text-gray-500">
      <div class="text-center">
        <i class="fas fa-comment-dots text-6xl mb-4 opacity-50"></i>
        <p class="text-lg">Sélectionnez une conversation pour commencer</p>
      </div>
    </div>
  `;
}

// Fonction pour afficher la gestion des membres
function afficherGestionMembres(action) {
  const modal = modalGestionMembres;
  const titre = document.getElementById('titre-gestion-membres');
  const liste = document.getElementById('liste-gestion-membres');
  
  modalGestionGroupe.classList.add('hidden');
  
  if (action === 'ajouter') {
    titre.textContent = 'Ajouter des membres';
    liste.innerHTML = '';
    
    // Afficher les contacts non membres
    contacts.forEach(contact => {
      if (!currentGroupeGestion.membres.includes(contact.id)) {
        liste.innerHTML += `
          <label class="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 rounded">
            <input type="checkbox" class="gestion-membre-checkbox" data-id="${contact.id}" data-action="ajouter" />
            <span>${contact.prenom} ${contact.nom}</span>
          </label>
        `;
      }
    });
    
    // Ajouter bouton de validation
    liste.innerHTML += `
      <button id="valider-ajout-membres" class="w-full bg-green-500 text-white py-2 rounded mt-2 hover:bg-green-600">
        Ajouter les membres sélectionnés
      </button>
    `;
    
  } else if (action === 'supprimer') {
    titre.textContent = 'Supprimer des membres';
    liste.innerHTML = '';
    
    // Afficher les membres actuels (sauf l'admin)
    currentGroupeGestion.membres.forEach(membreId => {
      if (membreId !== currentGroupeGestion.admin) {
        const membre = trouverContact(membreId);
        if (membre) {
          liste.innerHTML += `
            <label class="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 rounded">
              <input type="checkbox" class="gestion-membre-checkbox" data-id="${membre.id}" data-action="supprimer" />
              <span>${membre.prenom} ${membre.nom}</span>
            </label>
          `;
        }
      }
    });
    
    // Ajouter bouton de validation
    liste.innerHTML += `
      <button id="valider-suppression-membres" class="w-full bg-red-500 text-white py-2 rounded mt-2 hover:bg-red-600">
        Supprimer les membres sélectionnés
      </button>
    `;
  }
  
  modal.classList.remove('hidden');
}

// Event listeners pour la gestion des membres
document.addEventListener('click', (e) => {
  if (e.target.id === 'valider-ajout-membres') {
    const selectionnes = Array.from(document.querySelectorAll('.gestion-membre-checkbox:checked[data-action="ajouter"]'))
      .map(cb => parseInt(cb.dataset.id));
    
    if (selectionnes.length > 0) {
      currentGroupeGestion.membres = [...currentGroupeGestion.membres, ...selectionnes];
      modalGestionMembres.classList.add('hidden');
      
      // Mettre à jour l'affichage si le groupe est sélectionné
      if (selectedGroupe && selectedGroupe.id === currentGroupeGestion.id) {
        updateDiscussionHeader(currentGroupeGestion, 'groupe');
      }
      
      showNotification(`${selectionnes.length} membre(s) ajouté(s) !`);
    }
  }
  
  if (e.target.id === 'valider-suppression-membres') {
    const selectionnes = Array.from(document.querySelectorAll('.gestion-membre-checkbox:checked[data-action="supprimer"]'))
      .map(cb => parseInt(cb.dataset.id));
    
    if (selectionnes.length > 0) {
      currentGroupeGestion.membres = currentGroupeGestion.membres.filter(id => !selectionnes.includes(id));
      modalGestionMembres.classList.add('hidden');
      
      // Mettre à jour l'affichage si le groupe est sélectionné
      if (selectedGroupe && selectedGroupe.id === currentGroupeGestion.id) {
        updateDiscussionHeader(currentGroupeGestion, 'groupe');
      }
      
      showNotification(`${selectionnes.length} membre(s) supprimé(s) !`);
    }
  }
});

document.getElementById('close-gestion-membres').addEventListener('click', () => {
  modalGestionMembres.classList.add('hidden');
  modalGestionGroupe.classList.remove('hidden');
});

// Fonction pour afficher les notifications
function showNotification(message, type = 'success') {
  const notification = document.createElement("div");
  const bgColor = type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-orange-500' : 'bg-green-500';
  
  notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 flex items-center space-x-2`;
  
  const icon = type === 'error' ? 'fas fa-exclamation-circle' : 
               type === 'warning' ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle';
  
  notification.innerHTML = `
    <i class="${icon}"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Fonction pour popup de confirmation
function showConfirmDialog(message, onConfirm, onCancel = null) {
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center";
  
  overlay.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
      <div class="flex items-center space-x-3 mb-4">
        <i class="fas fa-question-circle text-blue-500 text-xl"></i>
        <h3 class="text-lg font-semibold">Confirmation</h3>
      </div>
      <p class="text-gray-600 mb-6">${message}</p>
      <div class="flex space-x-3 justify-end">
        <button id="cancel-confirm" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors">
          Annuler
        </button>
        <button id="ok-confirm" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Confirmer
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  overlay.querySelector('#ok-confirm').addEventListener('click', () => {
    document.body.removeChild(overlay);
    if (onConfirm) onConfirm();
  });
  
  overlay.querySelector('#cancel-confirm').addEventListener('click', () => {
    document.body.removeChild(overlay);
    if (onCancel) onCancel();
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
      if (onCancel) onCancel();
    }
  });
}

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  if (!checkAuth()) return;
  
  updateUserProfile();
  afficherDiscussions();
  updateGroupButtonVisibility();
});

// Remplacer la fonction checkAuth existante par celle-ci
function checkAuth() {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
        window.location.href = '../login.html';
        return false;
    }
    currentUser = JSON.parse(storedUser);
    return true;
}

function logout() {
    if (currentUser) {
        localStorage.removeItem('currentUser'); // Supprimer l'utilisateur du localStorage
        currentUser = null;
    }
    window.location.href = '../login.html';
}

// Ajouter le bouton de déconnexion dans les event listeners
document.getElementById('btn-logout').addEventListener('click', logout);

// Fonction pour mettre à jour le profil utilisateur dans l'interface
function updateUserProfile() {
  if (!currentUser) return;
  
  const userInitials = document.getElementById('user-initials');
  const userName = document.getElementById('user-name');
  
  userInitials.textContent = getInitials(currentUser.prenom, currentUser.nom);
  userName.textContent = `${currentUser.prenom} ${currentUser.nom}`;
}

// Ajouter l'appel dans le DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  if (!checkAuth()) return;
  
  updateUserProfile();
  afficherDiscussions();
  updateGroupButtonVisibility();
});
