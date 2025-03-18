document.addEventListener('DOMContentLoaded', () => {
  const clientCodeInput = document.getElementById('client-code');
  const companyNameInput = document.getElementById('company-name');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  const tankNumberInput = document.getElementById('tank-number');
  const propNumberInput = document.getElementById('prop-number');
  const capacityInput = document.getElementById('capacity');
  const viscosityInput = document.getElementById('viscosity');
  const colorInput = document.getElementById('color');
  const observationsInput = document.getElementById('observations');
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
        .bindPopup(`O Tanque está aqui!<br>Lat: ${latitude.toFixed(6)}<br>Lng: ${longitude.toFixed(6)}`)
        .openPopup();
    } else {
      map.setView([latitude, longitude], 15);
    }
  };

  // Capturar foto e mostrar localização
  document.getElementById('capture-photo').addEventListener('click', async () => {
    clientCode = sanitizeClientCode(clientCodeInput.value);
    const companyName = companyNameInput.value;
    const phone = sanitizePhone(phoneInput.value);
    const email = emailInput.value;
    const tankNumber = tankNumberInput.value;
    const propNumber = propNumberInput.value;
    const capacity = capacityInput.value;
    const viscosity = viscosityInput.value;
    const color = colorInput.value;
    const observations = observationsInput.value;

    if (!validateClientCode(clientCode)) {
      alert('Código do Cliente inválido ou inexistente\n\n(Campo Obrigatório)');
      return;
    }

    if (!companyName) {
      alert('Razão Social inválida ou inexistente\n\n(Campo Obrigatório)');
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

    if (!capacity) {
      alert('Selecione a capacidade do Tanque\n\n(Campo Obrigatório)');
      return;
    }

    if (!viscosity) {
      alert('Selecione a viscosidade do Produto\n\n(Campo Obrigatório)');
      return;
    }

    if (!color) {
      alert('Selecione a cor do tanque\n\n(Campo Obrigatório)');
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
        <strong>N° Tombamento Tanque:</strong> ${tankNumber || 'Não fornecido'}<br>
        <strong>N° Tombamento Propulsora:</strong> ${propNumber || 'Não fornecido'}<br>
        <strong>Capacidade do Tanque:</strong> ${capacity || 'Não fornecido'} Litros<br>
        <strong>Viscosidade do Tanque:</strong> ${viscosity || 'Não fornecido'}<br>
        <strong>Cor do Tanque:</strong> ${color || 'Não fornecido'}<br>
        <strong>Observações:</strong> ${observations || 'Não fornecido'}<br>
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
    const textData = `Código do Cliente: ${clientCode}\nRazão Social: ${companyNameInput.value}\nTelefone: ${phoneInput.value}\nE-mail: ${emailInput.value}\nN° Patrimônio Tanque: ${tankNumberInput.value}\nN° Patrimônio Propulsora: ${propNumberInput.value}\nCapacidade do Tanque: ${capacityInput.value} Litros\nViscosidade do Tanque: ${viscosityInput.value}\nCor do Tamque: ${colorInput.value}\nObservações: ${observationsInput.value}\nLatitude: ${locationData.latitude.toFixed(6)}\nLongitude: ${locationData.longitude.toFixed(6)}`;

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

  // Fazendo o campo Razão Social ficar em maiúsculas
  companyNameInput.addEventListener('input', () => {
    companyNameInput.value = companyNameInput.value.toUpperCase();
  });

  // Permitindo apenas números para os campos de capacidade e litros
  capacityInput.addEventListener('input', () => {
    capacityInput.value = capacityInput.value.replace(/[^0-9.]/g, '');  // Aceita apenas números e ponto
  });

  // Limpando os campos quando a página for recarregada
  window.addEventListener('load', () => {
    clientCodeInput.value = '';
    companyNameInput.value = '';
    phoneInput.value = '';
    emailInput.value = '';
    tankNumberInput.value = '';
    propNumberInput.value = '';
    capacityInput.value = '';
    viscosityInput.value = '';
    colorInput.value = '';
    observationsInput.value = '';
    photoPreview.style.display = 'none';
    info.innerHTML = '';
    mapTitle.style.display = 'none';
    shareButton.style.display = 'none';
    restartProcessButton.style.display = 'none';
  });
});
