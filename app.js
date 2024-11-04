// Vérifiez la compatibilité avec l'API ContactsManager
document.getElementById('fetch-contacts').addEventListener('click', async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      const props = ["name", "email", "tel"];
      const opts = { multiple: true };
      
      try {
        const contacts = await navigator.contacts.select(props, opts);
        document.getElementById('contact-list').textContent = JSON.stringify(contacts, null, 2);
      } catch (err) {
        console.error("Erreur lors de l'accès aux contacts: ", err);
      }
    } else {
      alert("L'API ContactsManager n'est pas supportée sur cet appareil.");
    }
  });
  