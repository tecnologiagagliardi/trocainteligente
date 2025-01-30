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

  // Validação do Código do Cliente
  const validateClientCode = (code) => /^C\d{6}$/.test(code);
  const sanitizeClientCode = (code) => code.toUpperCase().replace(/[^C0-9]/g, '');

  // Validação do telefone
  const validatePhone = (phone) => /^\(\d{2}\)\s?\d{5}-\d{4}$/.test(phone);
  const sanitizePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  // Validação de e-mail
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
        .bindPopup(`Você está aqui!<br>Lat: ${latitude}, Lng: ${longitude}`)
        .openPopup();

      mapTitle.style.display = 'block';
      mapContainer.style.display = 'block';
    } else {
      map.setView([latitude, longitude], 15);
      L.marker([latitude, longitude]).addTo(map);
    }
  };

  // Função para compartilhar as informações
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

  // Função de reinício
  restartProcessButton.addEventListener('click', () => {
    clientCodeInput.value = '';
    phoneInput.value = '';
    emailInput.value = '';
    businessNameInput.value = '';
    tankNumberInput.value = '';
    capacityInput.value = '';
    quantityInput.value = '';
    photoPreview.style.display = 'none';
    photoPreview.src = '';
    mapContainer.style.display = 'none';
    mapTitle.style.display = 'none';
    shareButton.style.display = 'none';
    restartProcessButton.style.display = 'none';
    info.textContent = '';
  });

  // Captura da foto e localização
  capturePhotoButton.addEventListener('click', async () => {
    clientCode = sanitizeClientCode(clientCodeInput.value);
    if (!validateClientCode(clientCode)) {
      alert('Código do Cliente inválido!');
      return;
    }
    
    const phone = sanitizePhone(phoneInput.value);
    if (!validatePhone(phone)) {
      alert('Telefone inválido!');
      return;
    }

    if (!validateEmail(emailInput.value)) {
      alert('E-mail inválido!');
      return;
    }

    try {
      const position = await getUserLocation();
      locationData.latitude = position.coords.latitude;
      locationData.longitude = position.coords.longitude;

      await capturePhoto();
      updateMap(locationData.latitude, locationData.longitude);

      info.innerHTML = `
        <b>Informações do Cliente:</b><br>
        Código: ${clientCode}<br>
        Telefone: ${phone}<br>
        E-mail: ${emailInput.value}<br>
        Razão Social: ${businessNameInput.value}<br>
        M° Tombamento: ${tankNumberInput.value}<br>
        Capacidade de Litros: ${capacityInput.value}<br>
        Quantidade de Litros: ${quantityInput.value}<br>
        Latitude: ${locationData.latitude.toFixed(6)}<br>
        Longitude: ${locationData.longitude.toFixed(6)}<br>
      `;

      shareButton.style.display = 'block';
      restartProcessButton.style.display = 'block';
    } catch (error) {
      alert('Erro ao obter a localização!');
    }
  });
});
