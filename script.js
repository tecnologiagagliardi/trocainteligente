document.addEventListener('DOMContentLoaded', () => {
  const clientCodeInput = document.getElementById('client-code');
  const companyNameInput = document.getElementById('company-name');
  const tombamentoInput = document.getElementById('tombamento');
  const capacityInput = document.getElementById('capacity');
  const quantityInput = document.getElementById('quantity');
  const capturePhotoButton = document.getElementById('capture-photo');
  const restartProcessButton = document.getElementById('restart-process');
  const photoPreview = document.getElementById('photo-preview');
  const info = document.getElementById('info');
  const shareButton = document.getElementById('share-data');
  const mapContainer = document.getElementById('map');
  const mapTitle = document.getElementById('map-title');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');

  let clientCode = '';
  let photoBlob = null;
  let locationData = {};
  let map = null;

  // Validação e sanitização
  const validateClientCode = (code) => /^C\d{6}$/.test(code);
  const sanitizeClientCode = (code) => code.toUpperCase().replace(/[^C0-9]/g, '');
  const validatePhone = (phone) => /^\(\d{2}\)\s?\d{5}-\d{4}$/.test(phone);
  const sanitizePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };
  const validateEmail = (email) => /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email);

  // Captura da foto
  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } },
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      const canvas = document.createElement('canvas');
      const capture = new Promise((resolve) => {
        video.addEventListener('loadedmetadata', () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          stream.getTracks().forEach(track => track.stop());
          resolve(canvas.toDataURL('image/jpeg'));
        });
      });

      const photoDataURL = await capture;
      photoBlob = await (await fetch(photoDataURL)).blob();
      photoPreview.src = photoDataURL;
      photoPreview.style.display = 'block';
    } catch (error) {
      console.error('Erro ao acessar a câmera:', error);
      alert('Erro ao acessar a câmera!');
    }
  };

  // Obtendo a localização do usuário
  const getUserLocation = () =>
    new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject)
    );

  // Atualizando o mapa
  const updateMap = (latitude, longitude) => {
    if (!map) {
      map = L.map('map').setView([latitude, longitude], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(`Você está aqui!<br>Lat: ${latitude.toFixed(6)}<br>Lng: ${longitude.toFixed(6)}`)
        .openPopup();
    } else {
      map.setView([latitude, longitude], 15);
    }
  };

  // Captura de foto e dados
  capturePhotoButton.addEventListener('click', async () => {
    clientCode = sanitizeClientCode(clientCodeInput.value);
    const companyName = companyNameInput.value;
    const tombamento = tombamentoInput.value;
    const capacity = capacityInput.value;
    const quantity = quantityInput.value;
    const phone = sanitizePhone(phoneInput.value);
    const email = emailInput.value;

    if (!validateClientCode(clientCode)) {
      alert('O código do cliente deve começar com "C" seguido de 6 números.');
      return;
    }

    if (phone && !validatePhone(phone)) {
      alert('Telefone inválido. Utilize o formato: (85) 91234-4321');
      return;
    }

    if (email && !validateEmail(email)) {
      alert('E-mail inválido. Utilize o formato: exemplo@dominio.com.');
      return;
    }

    try {
      await capturePhoto();

      const position = await getUserLocation();
      locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      info.innerHTML = `
        <strong>Código do Cliente:</strong> ${clientCode}<br>
        <strong>Razão Social:</strong> ${companyName}<br>
        <strong>N° Tombamento:</strong> ${tombamento}<br>
        <strong>Capacidade de Litros:</strong> ${capacity}<br>
        <strong>Quantidade de Litros:</strong> ${quantity}<br>
        <strong>Telefone:</strong> ${phone || 'Não fornecido'}<br>
        <strong>E-mail:</strong> ${email || 'Não fornecido'}<br>
        <strong>Latitude:</strong> ${locationData.latitude.toFixed(6)}<br>
        <strong>Longitude:</strong> ${locationData.longitude.toFixed(6)}<br>
      `;

      mapTitle.style.display = 'block';
      shareButton.style.display = 'block';
      restartProcessButton.style.display = 'block';
      updateMap(locationData.latitude, locationData.longitude);
    } catch (error) {
      console.error('Erro ao acessar a localização:', error);
      alert('Erro ao acessar a localização!');
    }
  });

  // Reiniciar o processo
  restartProcessButton.addEventListener('click', () => {
    location.reload();
  });

  // Compartilhar os dados por e-mail
  shareButton.addEventListener('click', () => {
    const textData = `Código do Cliente: ${clientCode}\nRazão Social: ${companyName}\nN° Tombamento: ${tombamento}\nCapacidade de Litros: ${capacity}\nQuantidade de Litros: ${quantity}\nTelefone: ${phoneInput.value}\nE-mail: ${emailInput.value}\nLatitude: ${locationData.latitude.toFixed(6)}\nLongitude: ${locationData.longitude.toFixed(6)}`;

    const mailtoLink = `mailto:${emailInput.value}?subject=Cadastro do Cliente&body=${encodeURIComponent(textData)}`;
    window.location.href = mailtoLink;
  });

  // Validação dos campos
  clientCodeInput.addEventListener('input', () => {
    clientCodeInput.value = sanitizeClientCode(clientCodeInput.value);
  });

  phoneInput.addEventListener('input', () => {
    phoneInput.value = sanitizePhone(phoneInput.value);
  });
});
