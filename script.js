document.addEventListener('DOMContentLoaded', () => {
  const clientCodeInput = document.getElementById('client-code');
  const companyNameInput = document.getElementById('company-name');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  const tankNumberInput = document.getElementById('tank-number');
  const capacityInput = document.getElementById('capacity');
  const litersInput = document.getElementById('liters');
  const photoPreview = document.getElementById('photo-preview');
  const info = document.getElementById('info');
  const mapTitle = document.getElementById('map-title');
  const mapContainer = document.getElementById('map');
  const shareButton = document.getElementById('share-data');
  const restartProcessButton = document.getElementById('restart-process');

  let clientCode = '';
  let photoBlob = null;
  let locationData = {};
  let map = null;

  // Função para validar código do cliente
  const validateClientCode = (code) => /^C\d{6}$/.test(code);
  const sanitizeClientCode = (code) => code.toUpperCase().replace(/[^C0-9]/g, '');

  // Função para validar telefone
  const validatePhone = (phone) => /^\(\d{2}\)\s?\d{5}-\d{4}$/.test(phone);
  const sanitizePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  // Função para validar e-mail
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

  // Função para obter a localização
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

  // Capturar foto e mostrar localização
  document.getElementById('capture-photo').addEventListener('click', async () => {
    clientCode = sanitizeClientCode(clientCodeInput.value);
    const phone = sanitizePhone(phoneInput.value);
    const email = emailInput.value;
    const companyName = companyNameInput.value;
    const tankNumber = tankNumberInput.value;
    const capacity = capacityInput.value;
    const liters = litersInput.value;

    if (!validateClientCode(clientCode)) {
      alert('Verifique novamente o Código do Cliente (Obrigatório)');
      return;
    }

    if (!companyName) {
      alert('Verifique novamente a Razão Social (Obrigatório)');
      return;
    }

    if (phone && !validatePhone(phone)) {
      alert('Número de telefone inválido.');
      return;
    }

    if (email && !validateEmail(email)) {
      alert('E-mail inválido.');
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
        <strong>Telefone:</strong> ${phone || 'Não fornecido'}<br>
        <strong>E-mail:</strong> ${email || 'Não fornecido'}<br>
        <strong>N° Tombamento:</strong> ${tankNumber || 'Não fornecido'}<br>
        <strong>Capacidade:</strong> ${capacity || 'Não fornecido'} Litros<br>
        <strong>Quantidade de Litros:</strong> ${liters || 'Não fornecido'} Litros<br>
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

  // Compartilhar dados
  shareButton.addEventListener('click', async () => {
    const textData = `Código do Cliente: ${clientCode}\nRazão Social: ${companyNameInput.value}\nTelefone: ${phoneInput.value}\nE-mail: ${emailInput.value}\nNúmero de Tombamento: ${tankNumberInput.value}\nCapacidade: ${capacityInput.value} Litros\nQuantidade de Litros: ${litersInput.value}\nLatitude: ${locationData.latitude.toFixed(6)}\nLongitude: ${locationData.longitude.toFixed(6)}`;

    // Verificando se o dispositivo suporta a funcionalidade de compartilhamento
    if (navigator.canShare && navigator.canShare({ files: [new File([photoBlob], `${clientCode}.jpg`, { type: 'image/jpeg' })] })) {
      try {
        const shareData = {
          title: 'Captura de Coordenadas',
          text: textData,
          files: [new File([photoBlob], `${clientCode}.jpg`, { type: 'image/jpeg' })],
        };
        await navigator.share(shareData);
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
        alert('Erro ao compartilhar os dados.');
      }
    } else if (navigator.canShare) {
      try {
        await navigator.share({ title: 'Cadastro de Cliente', text: textData });
      } catch (error) {
        console.log('Erro ao compartilhar texto:', error);
        alert('Erro ao compartilhar o texto.');
      }
    } else {
      // Caso o dispositivo não suporte o compartilhamento
      alert('Seu dispositivo não suporta a funcionalidade de compartilhamento.');
    }
  });

  // Validação do código do cliente
  clientCodeInput.addEventListener('input', () => {
    clientCodeInput.value = sanitizeClientCode(clientCodeInput.value);
  });

  // Validação do telefone
  phoneInput.addEventListener('input', () => {
    phoneInput.value = sanitizePhone(phoneInput.value);
  });
});
