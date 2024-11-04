document.getElementById('fetch-contacts').addEventListener('click', async () => {
  if ('contacts' in navigator && 'ContactsManager' in window) {
    const props = ["name", "email", "tel"];
    const opts = { multiple: true };

    try {
      const contacts = await navigator.contacts.select(props, opts);
      displayContacts(contacts);
    } catch (err) {
      console.error("Erreur lors de l'accès aux contacts : ", err);
    }
  } else {
    alert("L'API ContactsManager n'est pas supportée sur cet appareil.");
  }
});

function displayContacts(contacts) {
  const contactList = document.getElementById('contact-list');
  contactList.innerHTML = ''; // Vider la liste avant de l'afficher

  contacts.forEach(contact => {
    const contactCard = document.createElement('div');
    contactCard.className = 'contact-card';

    // Nom
    const name = contact.name ? contact.name[0] : 'Nom inconnu';
    const nameElement = document.createElement('h2');
    nameElement.textContent = name;
    contactCard.appendChild(nameElement);

    // Email
    if (contact.email) {
      const emailElement = document.createElement('p');
      emailElement.textContent = `Email: ${contact.email[0]}`;
      contactCard.appendChild(emailElement);
    }

    // Tel
    if (contact.tel) {
      const telElement = document.createElement('p');
      telElement.textContent = `Téléphone: ${contact.tel[0]}`;
      contactCard.appendChild(telElement);
    }

    contactList.appendChild(contactCard);
  });
}
