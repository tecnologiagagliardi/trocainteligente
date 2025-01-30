document.addEventListener('DOMContentLoaded', () => {
  const clientCodeInput = document.getElementById('client-code');
  const capturePhotoButton = document.getElementById('capture-photo');
  const restartProcessButton = document.getElementById('restart-process');
  const photoPreview = document.getElementById('photo-preview');
  const info = document.getElementById('info');
  const shareButton = document.getElementById('share-data');
  const mapContainer = document.getElementById('map');
  const mapTitle = document.getElementById('map-title');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  const businessNameInput = document.getElementById('business-name');
  const tankNumberInput = document.getElementById('tank-number');
  const capacityInput = document.getElementById('capacity');
  const quantityInput = document.getElementById('quantity');

  let clientCode = '';
  let photoBlob = null;
  let locationData = {};
  let map = null;

  // Validação dos campos
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

  // Função para capturar a foto
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

  // Função para obter a localização do usuário
  const getUserLocation = () =>
    new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject)
    );

  // Atualiza o mapa com a localização
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

  // Capturar foto e mostrar a localização no mapa
  capturePhotoButton.addEventListener('click', async () => {
    clientCode = sanitizeClientCode(clientCodeInput.value);
    const phone = sanitizePhone(phoneInput.value);
    const email = emailInput.value;
    const businessName = businessNameInput.value;
    const tankNumber = tankNumberInput.value;
    const capacity = capacityInput.value;
    const quantity = quantityInput.value;

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
        <strong>Telefone:</strong> ${phone || 'Não fornecido'}<br>
        <strong>E-mail:</strong> ${email || 'Não fornecido'}<br>
        <strong>Razão Social:</strong> ${businessName || 'Não fornecido'}<br>
        <strong>M° Tombamento:</strong> ${tankNumber || 'Não fornecido'}<br>
        <strong>Capacidade de Litros:</strong> ${capacity || 'Não fornecido'}<br>
        <strong>Quantidade de Litros:</strong> ${quantity || 'Não fornecido'}<br>
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

// Função para compartilhar por e-mail com a imagem como link
shareButton.addEventListener('click', () => {
  const subject = 'Troca Inteligente';
  const body = `
    Código do Cliente: ${clientCode}\n
    Telefone: ${phoneInput.value}\n
    E-mail: ${emailInput.value}\n
    Razão Social: ${businessNameInput.value}\n
    M° Tombamento: ${tankNumberInput.value}\n
    Capacidade de Litros: ${capacityInput.value}\n
    Quantidade de Litros: ${quantityInput.value}\n
    Latitude: ${locationData.latitude.toFixed(6)}\n
    Longitude: ${locationData.longitude.toFixed(6)}\n
    Foto do Cliente: [Imagem capturada](${photoPreview.src})
  `;
  window.location.href = `mailto:trocainteligente@grupogagliardi.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
 });


  // Validação do código do cliente
  clientCodeInput.addEventListener('input', () => {
    clientCodeInput.value = sanitizeClientCode(clientCodeInput.value);
  });

  phoneInput.addEventListener('input', () => {
    phoneInput.value = sanitizePhone(phoneInput.value);
  });
});
