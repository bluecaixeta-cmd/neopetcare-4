const API_BASE = String(
  window.NEOPETCARE_CONFIG?.API_URL || ''
).replace(/\/$/, '');

/* =========================================================
   ELEMENTOS GERAIS
========================================================= */

const toast = document.querySelector('.toast');

const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

const navMore = document.querySelector('.nav-more');
const navMoreToggle = document.querySelector('.nav-more-toggle');

const contrastToggle = document.querySelector('.contrast-toggle');
const contrastKey = 'neopetcare.contrast.v1';

const donationModal = document.querySelector('#donation-modal');
const reportModal = document.querySelector('#report-modal');
const adoptionModal = document.querySelector('#adoption-modal');

/* =========================================================
   API
========================================================= */

async function apiRequest(path, options = {}) {
  const controller = new AbortController();

  const timeoutId = window.setTimeout(
    () => controller.abort(),
    10000
  );

  const {
    signal,
    headers,
    ...requestOptions
  } = options;

  try {
    const response = await fetch(
      `${API_BASE}${path}`,
      {
        ...requestOptions,

        credentials: 'include',

        headers: {
          'Content-Type': 'application/json',
          ...(headers || {})
        },

        signal: signal || controller.signal
      }
    );

    const payload = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        payload.error ||
        `Erro na requisição (${response.status}).`
      );
    }

    return payload;

  } catch (error) {

    if (error.name === 'AbortError') {
      throw new Error(
        'O servidor demorou muito para responder.'
      );
    }

    throw error;

  } finally {
    window.clearTimeout(timeoutId);
  }
}

/* =========================================================
   AUXILIARES
========================================================= */

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>'"]/g,
    (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#039;',
      '"': '&quot;'
    })[character]
  );
}

let toastTimeoutId;

function showToast(message, type = 'success') {
  let toastElement =
    document.getElementById('neopetcare-toast-message');

  if (!toastElement) {
    toastElement = document.createElement('div');

    toastElement.id = 'neopetcare-toast-message';

    toastElement.setAttribute(
      'role',
      'status'
    );

    toastElement.setAttribute(
      'aria-live',
      'polite'
    );

    toastElement.setAttribute(
      'aria-atomic',
      'true'
    );

    document.body.appendChild(
      toastElement
    );
  }

  window.clearTimeout(
    toastTimeoutId
  );

  toastElement.textContent =
    String(
      message ||
      'Operação concluída.'
    );

  Object.assign(
    toastElement.style,
    {
      position: 'fixed',
      left: '50%',
      bottom: '24px',
      zIndex: '999999',

      display: 'block',
      visibility: 'visible',

      width: 'max-content',
      maxWidth: 'calc(100vw - 32px)',

      padding: '14px 18px',

      background:
        type === 'error'
          ? '#842029'
          : '#073b5c',

      color: '#ffffff',

      borderLeft:
        type === 'error'
          ? '5px solid #ff6b6b'
          : '5px solid #17c77b',

      borderRadius: '12px',

      boxShadow:
        '0 12px 32px rgba(0,0,0,0.28)',

      fontSize: '15px',
      fontWeight: '700',
      lineHeight: '1.4',

      opacity: '1',

      pointerEvents: 'none',

      transform:
        'translateX(-50%) translateY(0)',

      transition:
        'opacity 0.25s ease, transform 0.25s ease'
    }
  );

  toastTimeoutId =
    window.setTimeout(
      () => {
        toastElement.style.opacity =
          '0';

        toastElement.style.transform =
          'translateX(-50%) translateY(18px)';

        window.setTimeout(
          () => {
            toastElement.style.display =
              'none';

            toastElement.style.visibility =
              'hidden';
          },
          300
        );
      },
      4000
    );
}

/* =========================================================
   MENU
========================================================= */

function closeNavMore() {
  if (!navMore) {
    return;
  }

  navMore.classList.remove('open');

  if (navMoreToggle) {
    navMoreToggle.setAttribute(
      'aria-expanded',
      'false'
    );
  }
}

if (navMoreToggle && navMore) {

  navMoreToggle.addEventListener(
    'click',
    (event) => {

      event.stopPropagation();

      const isOpen =
        navMore.classList.contains('open');

      if (isOpen) {
        closeNavMore();
      } else {

        navMore.classList.add('open');

        navMoreToggle.setAttribute(
          'aria-expanded',
          'true'
        );
      }
    }
  );
}

document.addEventListener(
  'click',
  (event) => {

    const clickedInsideMore =
      navMore &&
      navMore.contains(event.target);

    if (!clickedInsideMore) {
      closeNavMore();
    }
  }
);

if (menuToggle && mainNav) {

  menuToggle.addEventListener(
    'click',
    () => {

      const isOpen =
        mainNav.classList.toggle('open');

      menuToggle.setAttribute(
        'aria-expanded',
        String(isOpen)
      );
    }
  );

  document
    .querySelectorAll('.main-nav a')
    .forEach((link) => {

      link.addEventListener(
        'click',
        () => {

          mainNav.classList.remove('open');

          menuToggle.setAttribute(
            'aria-expanded',
            'false'
          );
        }
      );
    });
}

/* =========================================================
   ALTO CONTRASTE
========================================================= */

function applyContrastMode(enabled) {

  document.body.classList.toggle(
    'contrast-mode',
    enabled
  );

  if (contrastToggle) {

    contrastToggle.setAttribute(
      'aria-pressed',
      String(enabled)
    );

    contrastToggle.textContent =
      enabled
        ? '☀ Modo normal'
        : '◐ Alto contraste';
  }

  try {

    localStorage.setItem(
      contrastKey,
      String(enabled)
    );

  } catch (error) {
    console.warn(
      'Não foi possível salvar o contraste.'
    );
  }
}

let savedContrast = false;

try {

  savedContrast =
    localStorage.getItem(
      contrastKey
    ) === 'true';

} catch (error) {
  savedContrast = false;
}

applyContrastMode(savedContrast);

if (contrastToggle) {

  contrastToggle.addEventListener(
    'click',
    () => {

      applyContrastMode(
        !document.body.classList.contains(
          'contrast-mode'
        )
      );
    }
  );
}

/* =========================================================
   DOAÇÃO
========================================================= */

function openDonationModal(event) {

  if (event) {
    event.preventDefault();
  }

  if (!donationModal) {
    return;
  }

  donationModal.classList.add('open');

  donationModal.setAttribute(
    'aria-hidden',
    'false'
  );
}

function closeDonationModal() {

  if (!donationModal) {
    return;
  }

  donationModal.classList.remove('open');

  donationModal.setAttribute(
    'aria-hidden',
    'true'
  );
}

document
  .querySelectorAll('.open-donation')
  .forEach((button) => {

    button.addEventListener(
      'click',
      openDonationModal
    );
  });

const donationClose =
  donationModal?.querySelector(
    '.modal-close'
  );

if (donationClose) {

  donationClose.addEventListener(
    'click',
    closeDonationModal
  );
}

if (donationModal) {

  donationModal.addEventListener(
    'click',
    (event) => {

      if (event.target === donationModal) {
        closeDonationModal();
      }
    }
  );
}

document
  .querySelectorAll('.amounts button')
  .forEach((button) => {

    button.addEventListener(
      'click',
      () => {

        document
          .querySelectorAll(
            '.amounts button'
          )
          .forEach((item) => {
            item.classList.remove(
              'selected'
            );
          });

        button.classList.add(
          'selected'
        );
      }
    );
  });

/* =========================================================
   FILTROS DOS PETS
========================================================= */

document
  .querySelectorAll('.filter')
  .forEach((filter) => {

    filter.addEventListener(
      'click',
      () => {

        document
          .querySelectorAll('.filter')
          .forEach((item) => {
            item.classList.remove(
              'active'
            );
          });

        filter.classList.add('active');

        const selected =
          filter.dataset.filter;

        document
          .querySelectorAll('.pet-card')
          .forEach((card) => {

            const types =
              card.dataset.type || '';

            const hidden =
              selected !== 'todos' &&
              !types.includes(selected);

            card.classList.toggle(
              'is-hidden',
              hidden
            );
          });
      }
    );
  });

/* =========================================================
   FAVORITOS
========================================================= */

document
  .querySelectorAll('.favorite')
  .forEach((button) => {

    button.addEventListener(
      'click',
      () => {

        button.classList.toggle(
          'saved'
        );

        button.textContent =
          button.classList.contains(
            'saved'
          )
            ? '♥'
            : '♡';
      }
    );
  });

/* =========================================================
   NEWSLETTER
========================================================= */

const newsletter =
  document.querySelector('.newsletter');

if (newsletter) {

  newsletter.addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();

      const email =
        new FormData(
          newsletter
        ).get('email');

      try {

        await apiRequest(
          '/api/newsletter',
          {
            method: 'POST',
            body: JSON.stringify({
              email
            })
          }
        );

        newsletter.reset();

        showToast(
          'E-mail cadastrado com sucesso!'
        );

      } catch (error) {

        showToast(
          error.message
        );
      }
    }
  );
}

/* =========================================================
   LOGIN / CADASTRO / LOGOUT
========================================================= */

const authForm =
  document.querySelector('#auth-form');

const authTabs = [
  ...document.querySelectorAll(
    '.auth-tab'
  )
];

const authNameField =
  document.querySelector(
    '.auth-name-field'
  );

const authSubmit =
  authForm?.querySelector(
    'button[type="submit"]'
  );

const loggedUser =
  document.querySelector(
    '#logged-user'
  );

const loggedUserName =
  document.querySelector(
    '#logged-user-name'
  );

const logoutButton =
  document.querySelector(
    '#logout-button'
  );

let authMode = 'login';
const authUserKey = 'neopetcare.auth.user.v1';

function saveLoggedUser(user) {
  if (!user) {
    return;
  }

  try {
    localStorage.setItem(
      authUserKey,
      JSON.stringify({
        name: user.name || '',
        email: user.email || ''
      })
    );
  } catch (error) {
    console.warn(
      'Não foi possível salvar o usuário.',
      error
    );
  }
}

function getSavedUser() {
  try {
    const savedUser =
      localStorage.getItem(authUserKey);

    if (!savedUser) {
      return null;
    }

    return JSON.parse(savedUser);
  } catch (error) {
    return null;
  }
}

function removeSavedUser() {
  try {
    localStorage.removeItem(authUserKey);
  } catch (error) {
    console.warn(
      'Não foi possível remover o usuário.',
      error
    );
  }
}

function updateAuthMode(mode) {

  authMode = mode;

  authTabs.forEach((tab) => {

    tab.classList.toggle(
      'active',
      tab.dataset.authTab === mode
    );
  });

  if (authNameField) {

    authNameField.hidden =
      mode !== 'signup';

    const nameInput =
      authNameField.querySelector(
        'input'
      );

    if (nameInput) {

      nameInput.required =
        mode === 'signup';
    }
  }

  if (authForm?.elements.password) {

    authForm.elements.password
      .autocomplete =
      mode === 'signup'
        ? 'new-password'
        : 'current-password';
  }

  if (authSubmit) {

    authSubmit.textContent =
      mode === 'signup'
        ? 'Criar minha conta →'
        : 'Entrar na minha conta →';
  }
}

function showLoggedUser(user) {

  if (!user) {
    return;
  }

  if (loggedUserName) {

    loggedUserName.textContent =
      user.name ||
      user.email ||
      'Usuário';
  }

  if (loggedUser) {
    loggedUser.hidden = false;
  }

  if (authForm) {
    authForm.hidden = true;
  }
}

function showLoggedOut() {

  if (loggedUserName) {
    loggedUserName.textContent = '';
  }

  if (loggedUser) {
    loggedUser.hidden = true;
  }

  if (authForm) {

    authForm.hidden = false;

    authForm.reset();
  }

  updateAuthMode('login');
}

authTabs.forEach((tab) => {

  tab.addEventListener(
    'click',
    () => {

      updateAuthMode(
        tab.dataset.authTab
      );
    }
  );
});

if (authForm) {

  authForm.addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();

      const data =
        Object.fromEntries(
          new FormData(authForm)
        );

      const endpoint =
        authMode === 'signup'
          ? '/api/auth/signup'
          : '/api/auth/login';

      if (
        authMode === 'signup' &&
        (
          !data.name ||
          data.name.trim().length < 2
        )
      ) {

        showToast(
          'Informe seu nome.'
        );

        return;
      }

      if (
        !data.password ||
        data.password.length < 8
      ) {

        showToast(
          'A senha precisa ter pelo menos 8 caracteres.'
        );

        return;
      }

      if (authSubmit) {
        authSubmit.disabled = true;
      }

      try {

        const result =
          await apiRequest(
            endpoint,
            {
              method: 'POST',
              body: JSON.stringify(data)
            }
          );

        authForm.reset();

        saveLoggedUser(result.user);

        showLoggedUser(
          result.user
        );

        await loadMyPublications();

        showToast(
          `Olá, ${result.user.name}! Login realizado com sucesso.`
        );

      } catch (error) {

        showToast(
          error.message
        );

      } finally {

        if (authSubmit) {
          authSubmit.disabled = false;
        }
      }
    }
  );
}

if (logoutButton) {

  logoutButton.addEventListener(
    'click',
    async () => {

      logoutButton.disabled = true;

      try {

        await apiRequest(
          '/api/auth/logout',
          {
            method: 'POST',
            body: JSON.stringify({})
          }
        );

        removeSavedUser();

        showLoggedOut();

        hideMyPublications();

        showToast(
          'Você saiu da sua conta com sucesso.'
        );

      } catch (error) {

        showToast(
          error.message
        );

      } finally {

        logoutButton.disabled = false;
      }
    }
  );
}
/* =========================================================
   ADOÇÃO
========================================================= */
/* =========================================================
   CADASTRAR NOVO ANIMAL
========================================================= */

const petRegisterModal =
  document.querySelector(
    '#pet-register-modal'
  );

const petRegisterForm =
  document.querySelector(
    '#pet-register-form'
  );

const petRegisterOpenButton =
  document.querySelector(
    '.open-pet-register'
  );

const petRegisterCloseButton =
  document.querySelector(
    '.pet-register-close'
  );

const petRegisterPhotoInput =
  document.querySelector(
    '#pet-register-photo'
  );

const petRegisterPhotoPreview =
  document.querySelector(
    '#pet-register-photo-preview'
  );

let petRegisterPhotoData = '';
let editingPetId = null;


/* =========================================================
   ABRIR FORMULÁRIO
========================================================= */

function openPetRegisterModal() {
  if (!petRegisterModal) {
    return;
  }

  petRegisterModal.classList.add(
    'open'
  );

  petRegisterModal.setAttribute(
    'aria-hidden',
    'false'
  );

  window.setTimeout(
    () => {
      const firstInput =
        petRegisterForm?.querySelector(
          'input, select, textarea'
        );

      firstInput?.focus();
    },
    50
  );
}

function openNewPetRegisterModal() {
  editingPetId = null;

  if (petRegisterForm) {
    petRegisterForm.reset();
  }

  clearPetRegisterPhoto();

  openPetRegisterModal();
}

function openPetEditModal(pet) {
  if (
    !petRegisterForm ||
    !pet
  ) {
    return;
  }

    editingPetId =
    Number(pet.id);

  const values = {
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    color: pet.color,
    sex: pet.sex,
    age: pet.age,
    size: pet.size,
    weight: pet.weight,
    identification: pet.identification,
    location: pet.location,
    vaccination: pet.vaccination,
    deworming: pet.deworming,
    neutering: pet.neutering,
    microchip: pet.microchip,
    specialNeeds: pet.specialNeeds,
    livesWithDogs: pet.livesWithDogs,
    livesWithCats: pet.livesWithCats,
    livesWithChildren: pet.livesWithChildren,
    temperament: pet.temperament,
    guardian: pet.guardian,
    story: pet.story,
    status: pet.status
  };

  Object.entries(values)
    .forEach(
      ([name, value]) => {
        const field =
          petRegisterForm.elements[name];

        if (field) {
          field.value =
            value ?? '';
        }
      }
    );

  petRegisterPhotoData =
    typeof pet.photo === 'string'
      ? pet.photo
      : '';

  if (
    petRegisterPhotoPreview &&
    petRegisterPhotoData
  ) {
    petRegisterPhotoPreview.src =
      petRegisterPhotoData;

    petRegisterPhotoPreview.hidden =
      false;
  }

  openPetRegisterModal();
}

/* =========================================================
   FECHAR FORMULÁRIO
========================================================= */

function closePetRegisterModal() {
  if (!petRegisterModal) {
    return;
  }

  petRegisterModal.classList.remove(
    'open'
  );

  petRegisterModal.setAttribute(
    'aria-hidden',
    'true'
  );

  editingPetId = null;
}


/* =========================================================
   LIMPAR FOTO
========================================================= */

function clearPetRegisterPhoto() {
  petRegisterPhotoData = '';

  if (petRegisterPhotoInput) {
    petRegisterPhotoInput.value = '';
  }

  if (petRegisterPhotoPreview) {
    petRegisterPhotoPreview.src = '';
    petRegisterPhotoPreview.hidden = true;
  }
}


/* =========================================================
   LER FOTO SELECIONADA
========================================================= */

function readPetRegisterPhoto(file) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.addEventListener(
        'load',
        () => {
          resolve(
            typeof reader.result === 'string'
              ? reader.result
              : ''
          );
        }
      );

      reader.addEventListener(
        'error',
        () => {
          reject(
            new Error(
              'Não foi possível ler a foto selecionada.'
            )
          );
        }
      );

      reader.readAsDataURL(file);
    }
  );
}


/* =========================================================
   BOTÃO ABRIR CADASTRO
========================================================= */

if (petRegisterOpenButton) {
  petRegisterOpenButton.addEventListener(
    'click',
    () => {
      editingPetId = null;

      if (petRegisterForm) {
        petRegisterForm.reset();
      }

      clearPetRegisterPhoto();

      openPetRegisterModal();
    }
  );
}


/* =========================================================
   BOTÃO FECHAR CADASTRO
========================================================= */

if (petRegisterCloseButton) {
  petRegisterCloseButton.addEventListener(
    'click',
    closePetRegisterModal
  );
}


/* =========================================================
   FECHAR CLICANDO NO FUNDO
========================================================= */

if (petRegisterModal) {
  petRegisterModal.addEventListener(
    'click',
    (event) => {
      if (
        event.target ===
        petRegisterModal
      ) {
        closePetRegisterModal();
      }
    }
  );
}


/* =========================================================
   PRÉVIA DA FOTO
========================================================= */

if (petRegisterPhotoInput) {
  petRegisterPhotoInput.addEventListener(
    'change',
    async () => {
      const file =
        petRegisterPhotoInput.files?.[0];

      if (!file) {
        clearPetRegisterPhoto();
        return;
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
      ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        clearPetRegisterPhoto();

        showToast(
          'Selecione uma foto JPG, PNG ou WebP.',
          'error'
        );

        return;
      }

      /*
       * A imagem vira texto Base64 e aumenta de tamanho.
       * O limite abaixo mantém a requisição abaixo do
       * limite de 4 MB configurado no backend.
       */
      const maximumFileSize =
        2.5 * 1024 * 1024;

      if (
        file.size >
        maximumFileSize
      ) {
        clearPetRegisterPhoto();

        showToast(
          'A foto deve ter no máximo 2,5 MB.',
          'error'
        );

        return;
      }

      try {
        petRegisterPhotoData =
          await readPetRegisterPhoto(
            file
          );

        if (petRegisterPhotoPreview) {
          petRegisterPhotoPreview.src =
            petRegisterPhotoData;

          petRegisterPhotoPreview.hidden =
            false;
        }

      } catch (error) {
        clearPetRegisterPhoto();

        showToast(
          error.message,
          'error'
        );
      }
    }
  );
}


/* =========================================================
   ENVIAR ANIMAL PARA O BACKEND
========================================================= */

if (petRegisterForm) {
  petRegisterForm.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      const formData =
        new FormData(
          petRegisterForm
        );

      const pet =
        Object.fromEntries(
          formData.entries()
        );

      /*
       * O arquivo não deve ser enviado diretamente
       * dentro do JSON.
       */
      delete pet.photoFile;

      pet.photo =
        petRegisterPhotoData;

      if (
        !pet.name?.trim() ||
        !pet.species?.trim() ||
        !pet.location?.trim() ||
        !pet.story?.trim()
      ) {
        showToast(
          'Preencha nome, espécie, localização e história do animal.',
          'error'
        );

        return;
      }

      const submitButton =
        petRegisterForm.querySelector(
          'button[type="submit"]'
        );

      const originalButtonText =
        submitButton?.textContent;

      if (submitButton) {
  submitButton.disabled = true;

  submitButton.textContent =
    editingPetId
      ? 'Salvando alterações...'
      : 'Cadastrando animal...';
}

      try {
        const parsedEditingPetId =
  Number(editingPetId);

const isEditing =
  editingPetId !== null &&
  editingPetId !== '' &&
  Number.isSafeInteger(
    parsedEditingPetId
  ) &&
  parsedEditingPetId > 0;

const endpoint =
  isEditing
    ? `/api/my-publications/pets/${encodeURIComponent(
        String(parsedEditingPetId)
      )}`
    : '/api/pets';

const method =
  isEditing
    ? 'PATCH'
    : 'POST';

const result =
  await apiRequest(
    endpoint,
    {
      method,

      body:
        JSON.stringify(
          pet
        )
    }
  );

         if (!result.pet) {
            throw new Error(
             'O servidor não retornou o animal cadastrado.'
          );
        }

        if (isEditing) {

  await loadMyPublications();

  showToast(
    `${result.pet.name} foi atualizado com sucesso!`
  );

} else {

  if (
    result.pet.imageStatus === 'approved'
  ) {
    renderPetCard(
      result.pet
    );
  }

  if (
    result.pet.imageStatus === 'pending'
  ) {
    showToast(
      `${result.pet.name} foi cadastrado. A foto está aguardando análise.`
    );
  } else {
    showToast(
      `${result.pet.name} foi cadastrado com sucesso!`
    );
  }
}

petRegisterForm.reset();

clearPetRegisterPhoto();

editingPetId = null;

closePetRegisterModal();

      } catch (error) {
        console.error(
  editingPetId
    ? 'Erro ao editar animal:'
    : 'Erro ao cadastrar animal:',
  error
);

        showToast(
  error.message ||
    (
      editingPetId
        ? 'Não foi possível editar o animal.'
        : 'Não foi possível cadastrar o animal.'
    ),
  'error'
);

      } finally {
        if (submitButton) {
          submitButton.disabled = false;

          submitButton.textContent =
            originalButtonText ||
            '🐾 Cadastrar animal';
        }
      }
    }
  );
}

/* =========================================================
   FICHA REUTILIZÁVEL DOS PETS
========================================================= */

const petDetailsModal =
  document.querySelector(
    '#pet-details-modal'
  );

const petDetailsClose =
  petDetailsModal?.querySelector(
    '.pet-details-close'
  );

const petDetailsAdoptionButton =
  document.querySelector(
    '#pet-details-adoption-button'
  );

const petDetailsDonationButton =
  document.querySelector(
    '#pet-details-donation-button'
  );


/* =========================================================
   DADOS DOS ANIMAIS
========================================================= */

const petsData = {
  Luna: {
    name: 'Luna',
    status: 'Disponível para adoção',
    imageClass: 'image-luna',

    species: 'Cão',
    breed: 'Sem raça definida',
    color: 'Caramelo',
    sex: 'Fêmea',
    age: '3 anos',
    size: 'Médio',
    weight: 'Não informado',
    identification: 'Não informada',

    location: 'Minas Gerais',

    vaccination: 'A confirmar',
    deworming: 'A confirmar',
    neutering: 'A confirmar',
    microchip: 'A confirmar',

    specialNeeds:
      'Nenhuma informação cadastrada',

    livesWithDogs: 'A confirmar',
    livesWithCats: 'A confirmar',
    livesWithChildren: 'A confirmar',

    temperament:
      'Informações em atualização',

    guardian:
      'As informações sobre quem está acolhendo Luna serão cadastradas nesta ficha.',

    story:
      'Luna procura uma família responsável para começar uma nova história. Nesta ficha poderão aparecer informações sobre sua rotina, comportamento e cuidados especiais.'
    },

  Mingau: {
    name: 'Mingau',
    status: 'Disponível para adoção',
    imageClass: 'image-mingau',

    species: 'Gato',
    breed: 'A confirmar',
    color: 'A confirmar',
    sex: 'A confirmar',
    age: '2 anos',
    size: 'Pequeno',
    weight: 'A confirmar',
    identification: 'A confirmar',

    location: 'Minas Gerais',

    vaccination: 'A confirmar',
    deworming: 'A confirmar',
    neutering: 'A confirmar',
    microchip: 'A confirmar',

    specialNeeds:
      'Nenhuma informação cadastrada',

    livesWithDogs: 'A confirmar',
    livesWithCats: 'A confirmar',
    livesWithChildren: 'A confirmar',

    temperament: 'A confirmar',

    guardian: 'A confirmar',

    story:
      'Mingau foi resgatado e está pronto para encontrar uma família.'
  },

  Thor: {
    name: 'Thor',
    status: 'Em tratamento',
    imageClass: 'image-thor',

    species: 'Cão',
    breed: 'A confirmar',
    color: 'A confirmar',
    sex: 'A confirmar',
    age: '5 anos',
    size: 'Grande',
    weight: 'A confirmar',
    identification: 'A confirmar',

    location: 'Minas Gerais',

    vaccination: 'A confirmar',
    deworming: 'A confirmar',
    neutering: 'A confirmar',
    microchip: 'A confirmar',

    specialNeeds:
      'Necessita acompanhamento. Mais informações em atualização.',

    livesWithDogs: 'A confirmar',
    livesWithCats: 'A confirmar',
    livesWithChildren: 'A confirmar',

    temperament: 'A confirmar',

    guardian: 'A confirmar',

    story:
      'Thor precisa de acompanhamento e busca uma família preparada para adotá-lo.'
  },

  Mel: {
    name: 'Mel',
    status: 'Em lar temporário',
    imageClass: 'image-mel',

    species: 'Gato',
    breed: 'A confirmar',
    color: 'A confirmar',
    sex: 'A confirmar',
    age: '1 ano',
    size: 'Pequeno',
    weight: 'A confirmar',
    identification: 'A confirmar',

    location: 'Minas Gerais',

    vaccination: 'A confirmar',
    deworming: 'A confirmar',
    neutering: 'A confirmar',
    microchip: 'A confirmar',

    specialNeeds:
      'Nenhuma informação cadastrada',

    livesWithDogs: 'A confirmar',
    livesWithCats: 'A confirmar',
    livesWithChildren: 'A confirmar',

    temperament: 'A confirmar',

    guardian:
      'Atualmente em lar temporário. Mais informações em atualização.',

    story:
      'Mel procura uma família ou um lar temporário.'
  }
};

/* =========================================================
   ANIMAIS CARREGADOS DO POSTGRESQL
========================================================= */

const petGrid =
  document.querySelector(
    '#pet-grid'
  );


function getPetDataKey(pet) {
  if (pet?.id) {
    return `db-${pet.id}`;
  }

  return pet?.name || '';
}


function getPetStatusLabel(status) {
  const statuses = {
    disponivel:
      'Disponível para adoção',

    tratamento:
      'Em tratamento',

    'lar-temporario':
      'Em lar temporário',

    adotado:
      'Adotado'
  };

  return (
    statuses[status] ||
    'Disponível para adoção'
  );
}


function normalizePetFromApi(pet) {
  return {
    id:
      pet.id,

    name:
      pet.name ||
      'Animal',

    status:
      getPetStatusLabel(
        pet.status
      ),

    species:
      pet.species ||
      'Não informado',

    breed:
      pet.breed ||
      'A confirmar',

    color:
      pet.color ||
      'A confirmar',

    sex:
      pet.sex ||
      'A confirmar',

    age:
      pet.age ||
      'A confirmar',

    size:
      pet.size ||
      'A confirmar',

    weight:
      pet.weight ||
      'A confirmar',

    identification:
      pet.identification ||
      'A confirmar',

    location:
      pet.location ||
      'Local não informado',

    vaccination:
      pet.vaccination ||
      'A confirmar',

    deworming:
      pet.deworming ||
      'A confirmar',

    neutering:
      pet.neutering ||
      'A confirmar',

    microchip:
      pet.microchip ||
      'A confirmar',

    specialNeeds:
      pet.specialNeeds ||
      'Nenhuma informação cadastrada',

    livesWithDogs:
      pet.livesWithDogs ||
      'A confirmar',

    livesWithCats:
      pet.livesWithCats ||
      'A confirmar',

    livesWithChildren:
      pet.livesWithChildren ||
      'A confirmar',

    temperament:
      pet.temperament ||
      'A confirmar',

    guardian:
      pet.guardian ||
      'Responsável atual não informado',

    story:
      pet.story ||
      'História não cadastrada',

    photo:
      pet.photo ||
      '',

    databasePet:
      true
  };
}

/* =========================================================
   CRIAR CARD DE ANIMAL VINDO DO BANCO
========================================================= */

function renderPetCard(pet) {
  if (!petGrid || !pet) {
    return;
  }

  const normalizedPet =
    normalizePetFromApi(pet);

  const petKey =
    getPetDataKey(pet);

  if (!petKey) {
    return;
  }

  /*
   * Evita duplicar o mesmo animal
   * caso loadPets() seja executado novamente.
   */
  const existingCard =
    petGrid.querySelector(
      `[data-database-pet="${pet.id}"]`
    );

  if (existingCard) {
    return;
  }

  /*
   * Coloca o animal dentro do mesmo catálogo
   * usado pela ficha "Ver detalhes".
   */
  petsData[petKey] =
    normalizedPet;


  /* =====================================================
     ESPÉCIE PARA FILTROS
  ===================================================== */

  const speciesFilter =
    String(
      pet.species || ''
    )
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /\s+/g,
        '-'
      );


  /* =====================================================
     FOTO
  ===================================================== */

  const photo =
    typeof pet.photo === 'string'
      ? pet.photo.trim()
      : '';

  const validPhoto =
    photo.startsWith(
      'data:image/'
    ) ||
    photo.startsWith(
      'https://'
    );

  const photoStyle =
    validPhoto
      ? `style="background-image:url('${photo.replace(
          /'/g,
          '%27'
        )}')"`
      : '';


  /* =====================================================
     STATUS
  ===================================================== */

  const statusLabels = {
    disponivel:
      'Adoção',

    tratamento:
      'Tratamento',

    'lar-temporario':
      'Lar temporário',

    adotado:
      'Adotado'
  };

  const statusLabel =
    statusLabels[pet.status] ||
    'Adoção';


  /* =====================================================
     CRIAR CARD
  ===================================================== */

  const card =
    document.createElement(
      'article'
    );

  card.className =
    'pet-card';

  card.dataset.type =
    [
      speciesFilter,
      pet.status ===
        'tratamento'
        ? 'tratamento'
        : ''
    ]
      .filter(Boolean)
      .join(' ');

  card.dataset.databasePet =
    String(pet.id);


  card.innerHTML = `
    <div class="card-content">

      <h3>
        ${escapeHtml(
          normalizedPet.name
        )}
      </h3>

      <p class="pet-profile">
        ${escapeHtml(
          normalizedPet.species
        )}
        ·
        ${escapeHtml(
          normalizedPet.age
        )}
        ·
        ${escapeHtml(
          normalizedPet.size
        )}
      </p>


      <div
        class="pet-image pet-database-image"
        ${photoStyle}
      >

        <span class="tag green">
          ${escapeHtml(
            statusLabel
          )}
        </span>

        <button
          class="favorite"
          type="button"
          aria-label="Favoritar ${escapeHtml(
            normalizedPet.name
          )}"
        >
          ♡
        </button>

      </div>


      <div class="pet-summary">

        <span>
          🐾 ${escapeHtml(
            normalizedPet.species
          )}
        </span>

        <span>
          ${escapeHtml(
            normalizedPet.sex
          )}
        </span>

        <span>
          🎂 ${escapeHtml(
            normalizedPet.age
          )}
        </span>

        <span>
          📏 ${escapeHtml(
            normalizedPet.size
          )}
        </span>

      </div>


      <p class="pet-health">
        ${escapeHtml(
          normalizedPet.story
        )}
      </p>


      <div class="pet-quick-info">

        <span>
          <strong>Raça:</strong>
          ${escapeHtml(
            normalizedPet.breed
          )}
        </span>

        <span>
          <strong>Cor:</strong>
          ${escapeHtml(
            normalizedPet.color
          )}
        </span>

        <span>
          <strong>Vacinas:</strong>
          ${escapeHtml(
            normalizedPet.vaccination
          )}
        </span>

        <span>
          <strong>Castração:</strong>
          ${escapeHtml(
            normalizedPet.neutering
          )}
        </span>

      </div>


      <p class="pet-location">
        📍
        ${escapeHtml(
          normalizedPet.location
        )}
      </p>


      <button
        class="card-button pet-details-button"
        type="button"
        data-pet-details="${escapeHtml(
          petKey
        )}"
      >
        🐾 Ver detalhes
      </button>


      <button
        class="card-button adoption-button"
        type="button"
        data-pet="${escapeHtml(
          normalizedPet.name
        )}"
      >
        🏡 Quero adotar
      </button>


      <button
        class="card-button open-donation"
        type="button"
      >
        ❤️ Apoiar agora
      </button>

    </div>
  `;


  /* =====================================================
     VER DETALHES
  ===================================================== */

  const detailsButton =
    card.querySelector(
      '.pet-details-button'
    );

  if (detailsButton) {
    detailsButton.addEventListener(
      'click',
      () => {
        openPetDetails(
          petKey
        );
      }
    );
  }


  /* =====================================================
     ADOÇÃO
  ===================================================== */

  const adoptionButton =
    card.querySelector(
      '.adoption-button'
    );

  if (adoptionButton) {
    adoptionButton.addEventListener(
      'click',
      () => {
        openAdoptionModal(
          normalizedPet.name
        );
      }
    );
  }


  /* =====================================================
     FAVORITO
  ===================================================== */

  const favoriteButton =
    card.querySelector(
      '.favorite'
    );

  if (favoriteButton) {
    favoriteButton.addEventListener(
      'click',
      () => {
        favoriteButton.classList.toggle(
          'saved'
        );

        favoriteButton.textContent =
          favoriteButton.classList.contains(
            'saved'
          )
            ? '♥'
            : '♡';
      }
    );
  }


  /* =====================================================
     DOAÇÃO
  ===================================================== */

  const donationButton =
    card.querySelector(
      '.open-donation'
    );

  if (donationButton) {
    donationButton.addEventListener(
      'click',
      openDonationModal
    );
  }


  petGrid.appendChild(
    card
  );
}


/* =========================================================
   CARREGAR ANIMAIS DO POSTGRESQL
========================================================= */

async function loadPets() {
  if (!petGrid) {
    return;
  }

  try {
    const result =
      await apiRequest(
        '/api/pets'
      );

    if (
      !Array.isArray(
        result.pets
      )
    ) {
      return;
    }

    result.pets.forEach(
      (pet) => {
        renderPetCard(pet);
      }
    );

  } catch (error) {
    console.error(
      'Erro ao carregar animais:',
      error
    );

    showToast(
      'Não foi possível carregar os animais cadastrados.',
      'error'
    );
  }
}

/* =========================================================
   AUXILIAR PARA PREENCHER TEXTO
========================================================= */

function setPetDetailsText(
  selector,
  value,
  fallback = 'Não informado'
) {
  const element =
    document.querySelector(
      selector
    );

  if (!element) {
    return;
  }

  element.textContent =
    value || fallback;
}


/* =========================================================
   ABRIR FICHA DO ANIMAL
========================================================= */

function openPetDetails(petName) {
  if (!petDetailsModal) {
    return;
  }

  const pet =
    petsData[petName];

  if (!pet) {
    showToast(
      'As informações deste animal ainda não estão disponíveis.',
      'error'
    );

    return;
  }

  setPetDetailsText(
    '#pet-details-status',
    pet.status,
    'Disponível para adoção'
  );

  setPetDetailsText(
    '#pet-details-title',
    pet.name,
    'Animal'
  );

  setPetDetailsText(
    '#pet-details-profile',
    [
      pet.species,
      pet.sex,
      pet.age,
      pet.size
    ]
      .filter(Boolean)
      .join(' · '),
    'Informações em atualização'
  );

  setPetDetailsText(
    '#pet-details-location',
    pet.location
      ? `📍 ${pet.location}`
      : 'Localização não informada'
  );

  setPetDetailsText(
    '#pet-details-species',
    pet.species
  );

  setPetDetailsText(
    '#pet-details-breed',
    pet.breed,
    'Não informada'
  );

  setPetDetailsText(
    '#pet-details-color',
    pet.color,
    'Não informada'
  );

  setPetDetailsText(
    '#pet-details-sex',
    pet.sex
  );

  setPetDetailsText(
    '#pet-details-age',
    pet.age,
    'Não informada'
  );

  setPetDetailsText(
    '#pet-details-size',
    pet.size
  );

  setPetDetailsText(
    '#pet-details-weight',
    pet.weight
  );

  setPetDetailsText(
    '#pet-details-identification',
    pet.identification,
    'Não informada'
  );

  setPetDetailsText(
    '#pet-details-vaccination',
    pet.vaccination,
    'A confirmar'
  );

  setPetDetailsText(
    '#pet-details-deworming',
    pet.deworming,
    'A confirmar'
  );

  setPetDetailsText(
    '#pet-details-neutering',
    pet.neutering,
    'A confirmar'
  );

  setPetDetailsText(
    '#pet-details-microchip',
    pet.microchip,
    'A confirmar'
  );

  setPetDetailsText(
    '#pet-details-special-needs',
    pet.specialNeeds,
    'Nenhuma informação cadastrada'
  );

  setPetDetailsText(
    '#pet-details-dogs',
    pet.livesWithDogs,
    'A confirmar'
  );

  setPetDetailsText(
    '#pet-details-cats',
    pet.livesWithCats,
    'A confirmar'
  );

  setPetDetailsText(
    '#pet-details-children',
    pet.livesWithChildren,
    'A confirmar'
  );

  setPetDetailsText(
    '#pet-details-temperament',
    pet.temperament
  );

  setPetDetailsText(
    '#pet-details-guardian',
    pet.guardian,
    'Responsável atual não informado.'
  );

  setPetDetailsText(
    '#pet-details-story',
    pet.story,
    'A história deste animal ainda não foi cadastrada.'
  );

  const detailsPhoto =
    document.querySelector(
      '#pet-details-photo'
    );

  if (detailsPhoto) {
    detailsPhoto.className =
      'pet-details-photo';

    if (pet.imageClass) {
      detailsPhoto.classList.add(
        pet.imageClass
      );
    }

    detailsPhoto.setAttribute(
      'aria-label',
      `Foto de ${pet.name}`
    );
  }

  if (petDetailsAdoptionButton) {
    petDetailsAdoptionButton.dataset.pet =
      pet.name;

    petDetailsAdoptionButton.textContent =
      `🏡 Quero adotar ${pet.name}`;
  }

  petDetailsModal.classList.add(
    'open'
  );

  petDetailsModal.setAttribute(
    'aria-hidden',
    'false'
  );
}


/* =========================================================
   FECHAR FICHA DO ANIMAL
========================================================= */

function closePetDetails() {
  if (!petDetailsModal) {
    return;
  }

  petDetailsModal.classList.remove(
    'open'
  );

  petDetailsModal.setAttribute(
    'aria-hidden',
    'true'
  );
}


/* =========================================================
   BOTÕES VER DETALHES
========================================================= */

document
  .querySelectorAll(
    '[data-pet-details]'
  )
  .forEach((button) => {
    button.addEventListener(
      'click',
      () => {
        openPetDetails(
          button.dataset.petDetails
        );
      }
    );
  });


/* =========================================================
   FECHAR PELO BOTÃO OU FUNDO
========================================================= */

if (petDetailsClose) {
  petDetailsClose.addEventListener(
    'click',
    closePetDetails
  );
}

if (petDetailsModal) {
  petDetailsModal.addEventListener(
    'click',
    (event) => {
      if (
        event.target ===
        petDetailsModal
      ) {
        closePetDetails();
      }
    }
  );
}


/* =========================================================
   ADOÇÃO E APOIO PELA FICHA
========================================================= */

if (petDetailsAdoptionButton) {
  petDetailsAdoptionButton.addEventListener(
    'click',
    () => {
      const petName =
        petDetailsAdoptionButton.dataset.pet ||
        'este pet';

      closePetDetails();

      openAdoptionModal(
        petName
      );
    }
  );
}

if (petDetailsDonationButton) {
  petDetailsDonationButton.addEventListener(
    'click',
    closePetDetails
  );
}

const adoptionForm =
  document.querySelector(
    '#adoption-form'
  );

const adoptionPetName =
  document.querySelector(
    '#adoption-pet-name'
  );

const adoptionPetInput =
  document.querySelector(
    '#adoption-pet-input'
  );

const adoptionCloseButton =
  document.querySelector(
    '.adoption-modal-close'
  );

function openAdoptionModal(petName) {

  if (
    !adoptionModal ||
    !adoptionPetName ||
    !adoptionPetInput
  ) {
    return;
  }

  adoptionPetName.textContent =
    petName;

  adoptionPetInput.value =
    petName;

  adoptionModal.classList.add(
    'open'
  );

  adoptionModal.setAttribute(
    'aria-hidden',
    'false'
  );
}

function closeAdoptionModal() {

  if (!adoptionModal) {
    return;
  }

  adoptionModal.classList.remove(
    'open'
  );

  adoptionModal.setAttribute(
    'aria-hidden',
    'true'
  );
}

document
  .querySelectorAll(
    '.adoption-button'
  )
  .forEach((button) => {

    button.addEventListener(
      'click',
      () => {

        const petName =
          button.dataset.pet ||
          'este pet';

        openAdoptionModal(
          petName
        );
      }
    );
  });

if (adoptionCloseButton) {

  adoptionCloseButton.addEventListener(
    'click',
    closeAdoptionModal
  );
}

if (adoptionModal) {

  adoptionModal.addEventListener(
    'click',
    (event) => {

      if (
        event.target ===
        adoptionModal
      ) {
        closeAdoptionModal();
      }
    }
  );
}

if (adoptionForm) {

  adoptionForm.addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();

      const interest =
        Object.fromEntries(
          new FormData(
            adoptionForm
          )
        );

      if (
        !interest.pet ||
        !interest.name ||
        !interest.email ||
        !interest.message
      ) {

        showToast(
          'Preencha nome, e-mail e mensagem.'
        );

        return;
      }

      const submitButton =
        adoptionForm.querySelector(
          'button[type="submit"]'
        );

      if (submitButton) {
        submitButton.disabled = true;
      }

      try {

        await apiRequest(
          '/api/adoptions',
          {
            method: 'POST',

            body: JSON.stringify(
              interest
            )
          }
        );

        const selectedPet =
          interest.pet;

        adoptionForm.reset();

        closeAdoptionModal();

        showToast(
          `Interesse por ${selectedPet} enviado com sucesso!`
        );

      } catch (error) {

        showToast(
          error.message
        );

      } finally {

        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    }
  );
}

/* =========================================================
   ACHADOS E PERDIDOS
========================================================= */

const reportForm =
  document.querySelector(
    '#report-form'
  );

  const reportPhotoInput =
  document.querySelector(
    '#report-photo'
  );

const reportPhotoPreview =
  document.querySelector(
    '#report-photo-preview'
  );

let reportPhotoData = '';
let editingReportId = null;


function clearReportPhoto() {
  reportPhotoData = '';

  if (reportPhotoInput) {
    reportPhotoInput.value = '';
  }

  if (reportPhotoPreview) {
    reportPhotoPreview.src = '';
    reportPhotoPreview.hidden = true;
  }
}


function readReportPhoto(file) {
  return new Promise(
    (resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener(
        'load',
        () => {
          resolve(
            typeof reader.result === 'string'
              ? reader.result
              : ''
          );
        }
      );

      reader.addEventListener(
        'error',
        () => {
          reject(
            new Error(
              'Não foi possível ler a foto selecionada.'
            )
          );
        }
      );

      reader.readAsDataURL(file);
    }
  );
}


if (reportPhotoInput) {
  reportPhotoInput.addEventListener(
    'change',
    async () => {
      const file =
        reportPhotoInput.files?.[0];

      if (!file) {
        clearReportPhoto();
        return;
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
      ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        clearReportPhoto();

        showToast(
          'Selecione uma foto JPG, PNG ou WebP.',
          'error'
        );

        return;
      }

      const maximumFileSize =
        2.5 * 1024 * 1024;

      if (
        file.size >
        maximumFileSize
      ) {
        clearReportPhoto();

        showToast(
          'A foto deve ter no máximo 2,5 MB.',
          'error'
        );

        return;
      }

      try {
        reportPhotoData =
          await readReportPhoto(
            file
          );

        if (reportPhotoPreview) {
          reportPhotoPreview.src =
            reportPhotoData;

          reportPhotoPreview.hidden =
            false;
        }

      } catch (error) {
        clearReportPhoto();

        showToast(
          error.message,
          'error'
        );
      }
    }
  );
}

const reportGrid =
  document.querySelector(
    '#report-grid'
  );

const reportCloseButton =
  document.querySelector(
    '.report-modal-close'
  );

const lostFoundSearch =
  document.querySelector(
    '#lost-found-search'
  );

const emptyReports =
  document.querySelector(
    '#empty-reports'
  );

let selectedReportStatus =
  'perdido';

/* =========================================================
   ABRIR / FECHAR MODAL DE OCORRÊNCIA
========================================================= */

function openReportModal() {

  if (!reportModal) {
    return;
  }

  reportModal.classList.add(
    'open'
  );

  reportModal.setAttribute(
    'aria-hidden',
    'false'
  );
}

function openReportEditModal(report) {
  if (
    !reportForm ||
    !report
  ) {
    return;
  }

  editingReportId =
    report.id;

  selectedReportStatus =
    report.status === 'encontrado'
      ? 'encontrado'
      : 'perdido';

  const values = {
    name: report.name,
    animal: report.animal,
    breed: report.breed,
    color: report.color,
    sex: report.sex,
    age: report.age,
    size: report.size,
    identification:
      report.identification,
    microchip:
      report.microchip,
    neutering:
      report.neutering,
    distinctiveFeatures:
      report.distinctiveFeatures,
    date:
      report.date,
    location:
      report.location,
    contact:
      report.contact,
    description:
      report.description
  };

  Object.entries(values)
    .forEach(
      ([name, value]) => {
        const field =
          reportForm.elements[name];

        if (field) {
          field.value =
            value ?? '';
        }
      }
    );

  reportPhotoData =
    typeof report.photo === 'string'
      ? report.photo
      : '';

  openReportModal();
}

function closeReportModal() {

  if (!reportModal) {
    return;
  }

  reportModal.classList.remove(
    'open'
  );

  reportModal.setAttribute(
    'aria-hidden',
    'true'
  );

  editingReportId = null;
}

document
  .querySelectorAll(
    '.open-report'
  )
  .forEach((button) => {

    button.addEventListener(
      'click',
      openReportModal
    );
  });

if (reportCloseButton) {

  reportCloseButton.addEventListener(
    'click',
    closeReportModal
  );
}

if (reportModal) {

  reportModal.addEventListener(
    'click',
    (event) => {

      if (
        event.target ===
        reportModal
      ) {
        closeReportModal();
      }
    }
  );
}

/* =========================================================
   TIPO DA OCORRÊNCIA
========================================================= */

document
  .querySelectorAll(
    '.report-type-button'
  )
  .forEach((button) => {

    button.addEventListener(
      'click',
      () => {

        document
          .querySelectorAll(
            '.report-type-button'
          )
          .forEach((item) => {

            item.classList.remove(
              'selected'
            );
          });

        button.classList.add(
          'selected'
        );

        selectedReportStatus =
          button.dataset.reportType ||
          'perdido';
      }
    );
  });

/* =========================================================
   FORMATAR DATA
========================================================= */

function formatReportDate(value) {

  if (!value) {
    return 'Data não informada';
  }

  try {

    const dateText =
      String(value)
        .slice(0, 10);

    const date =
      new Date(
        `${dateText}T12:00:00`
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return dateText;
    }

    return date.toLocaleDateString(
      'pt-BR'
    );

  } catch (error) {

    return String(value);
  }
}

/* =========================================================
   CRIAR CARD DE OCORRÊNCIA
========================================================= */

function renderReport(report) {

  if (!reportGrid) {
    return;
  }

  const status =
    report.status === 'encontrado'
      ? 'encontrado'
      : 'perdido';

  const statusLabel =
    status === 'perdido'
      ? 'Perdido'
      : 'Encontrado';

  const statusClass =
    status === 'perdido'
      ? 'status-lost'
      : 'status-found';


  /* =====================================================
     CRIAR CARD
  ===================================================== */

  const card =
    document.createElement(
      'article'
    );

  card.className =
    'report-card';

  card.dataset.status =
    status;


  /* =====================================================
     TEXTO UTILIZADO NA BUSCA
  ===================================================== */

  card.dataset.search =
    [
      report.name || '',
      report.animal || '',
      report.breed || '',
      report.color || '',
      report.sex || '',
      report.age || '',
      report.size || '',
      report.identification || '',
      report.microchip || '',
      report.neutering || '',
      report.distinctiveFeatures || '',
      report.location || '',
      report.description || ''
    ]
      .join(' ')
      .toLowerCase();


  /* =====================================================
     FOTO
  ===================================================== */

  const photo =
    typeof report.photo === 'string'
      ? report.photo.trim()
      : '';

  const allowedPhoto =
    photo.startsWith(
      'data:image/'
    ) ||
    photo.startsWith(
      'https://'
    );

  const photoHtml =
    allowedPhoto
      ? `
        <img
          class="report-photo-image"
          src="${escapeHtml(photo)}"
          alt="Foto de ${escapeHtml(
            report.name ||
            'animal'
          )}"
        >
      `
      : `
        <div class="report-photo-placeholder">
          🐾
        </div>
      `;


  /* =====================================================
     INFORMAÇÕES RÁPIDAS
  ===================================================== */

  const quickInformation = [];

  if (report.animal) {
    quickInformation.push(
      `
        <span>
          <strong>Espécie:</strong>
          ${escapeHtml(report.animal)}
        </span>
      `
    );
  }

  if (report.breed) {
    quickInformation.push(
      `
        <span>
          <strong>Raça:</strong>
          ${escapeHtml(report.breed)}
        </span>
      `
    );
  }

  if (report.color) {
    quickInformation.push(
      `
        <span>
          <strong>Cor:</strong>
          ${escapeHtml(report.color)}
        </span>
      `
    );
  }

  if (report.sex) {
    quickInformation.push(
      `
        <span>
          <strong>Sexo:</strong>
          ${escapeHtml(report.sex)}
        </span>
      `
    );
  }

  if (report.age) {
    quickInformation.push(
      `
        <span>
          <strong>Idade:</strong>
          ${escapeHtml(report.age)}
        </span>
      `
    );
  }

  if (report.size) {
    quickInformation.push(
      `
        <span>
          <strong>Porte:</strong>
          ${escapeHtml(report.size)}
        </span>
      `
    );
  }


  const quickInformationHtml =
    quickInformation.length
      ? `
        <div class="report-quick-info">
          ${quickInformation.join('')}
        </div>
      `
      : '';


  /* =====================================================
     IDENTIFICAÇÃO
  ===================================================== */

  const identificationInformation = [];

  if (report.identification) {
    identificationInformation.push(
      `
        <span>
          <strong>Identificação:</strong>
          ${escapeHtml(
            report.identification
          )}
        </span>
      `
    );
  }

  if (report.microchip) {
    identificationInformation.push(
      `
        <span>
          <strong>Microchip:</strong>
          ${escapeHtml(
            report.microchip
          )}
        </span>
      `
    );
  }

  if (report.neutering) {
    identificationInformation.push(
      `
        <span>
          <strong>Castração:</strong>
          ${escapeHtml(
            report.neutering
          )}
        </span>
      `
    );
  }

  if (report.distinctiveFeatures) {
    identificationInformation.push(
      `
        <span>
          <strong>Características:</strong>
          ${escapeHtml(
            report.distinctiveFeatures
          )}
        </span>
      `
    );
  }


  const identificationHtml =
    identificationInformation.length
      ? `
        <div class="report-identification">
          ${identificationInformation.join('')}
        </div>
      `
      : '';


  /* =====================================================
     CONTATO
  ===================================================== */

  const contactHtml =
    report.contact
      ? `
        <p class="report-contact">
          <strong>Contato:</strong>
          ${escapeHtml(
            report.contact
          )}
        </p>
      `
      : '';


  /* =====================================================
     CONTEÚDO DO CARD
  ===================================================== */

  card.innerHTML = `

    <div class="report-photo report-new">

      ${photoHtml}

      <span
        class="report-status ${statusClass}"
      >
        ${statusLabel}
      </span>

    </div>


    <div class="report-body">

      <h3>
        ${escapeHtml(
          report.name ||
          'Animal'
        )}

        <small>
          ${escapeHtml(
            report.animal ||
            ''
          )}
        </small>
      </h3>


      <p class="report-location">
        📍
        ${escapeHtml(
          report.location ||
          'Local não informado'
        )}
      </p>


      <span class="report-date">
        📅
        ${escapeHtml(
          formatReportDate(
            report.date
          )
        )}
      </span>


      ${quickInformationHtml}


      ${identificationHtml}


      <p class="report-description">

        ${escapeHtml(
          report.description ||
          ''
        )}

      </p>


      ${contactHtml}

    </div>
  `;


  reportGrid.prepend(
    card
  );
}

/* =========================================================
   FILTRAR OCORRÊNCIAS
========================================================= */

function filterReports() {

  if (!reportGrid) {
    return;
  }

  const search =
    lostFoundSearch
      ? lostFoundSearch.value
          .toLowerCase()
          .trim()
      : '';

  const activeFilter =
    document.querySelector(
      '.lost-filter.active'
    );

  const selectedStatus =
    activeFilter?.dataset.status ||
    'todos';

  let visibleCount = 0;

  document
    .querySelectorAll(
      '.report-card'
    )
    .forEach((card) => {

      const cardStatus =
        card.dataset.status ||
        '';

      const cardSearch =
        card.dataset.search ||
        '';

      const statusMatches =
        selectedStatus ===
          'todos' ||
        selectedStatus ===
          cardStatus;

      const searchMatches =
        cardSearch.includes(
          search
        );

      const visible =
        statusMatches &&
        searchMatches;

      card.hidden =
        !visible;

      if (visible) {
        visibleCount += 1;
      }
    });

  if (emptyReports) {

    emptyReports.classList.toggle(
      'visible',
      visibleCount === 0
    );
  }
}

if (lostFoundSearch) {

  lostFoundSearch.addEventListener(
    'input',
    filterReports
  );
}

document
  .querySelectorAll(
    '.lost-filter'
  )
  .forEach((filter) => {

    filter.addEventListener(
      'click',
      () => {

        document
          .querySelectorAll(
            '.lost-filter'
          )
          .forEach((item) => {

            item.classList.remove(
              'active'
            );
          });

        filter.classList.add(
          'active'
        );

        filterReports();
      }
    );
  });

/* =========================================================
   CARREGAR OCORRÊNCIAS DO POSTGRESQL
========================================================= */

async function loadReports() {

  if (!reportGrid) {
    return;
  }

  try {

    const result =
      await apiRequest(
        '/api/reports'
      );

    if (
      Array.isArray(
        result.reports
      )
    ) {

      result.reports
        .slice()
        .reverse()
        .forEach(
          renderReport
        );
    }

    filterReports();

  } catch (error) {

    console.error(
      'Erro ao carregar ocorrências:',
      error
    );

    showToast(
      'Não foi possível carregar as ocorrências.'
    );
  }
}

/* =========================================================
   CADASTRAR OCORRÊNCIA
========================================================= */

if (reportForm) {

  reportForm.addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();

      const formData =
        new FormData(
          reportForm
        );


      /* =====================================================
         MONTAR DADOS DA OCORRÊNCIA
      ===================================================== */

      const report = {

        status:
          selectedReportStatus,

        name:
          String(
            formData.get('name') ||
            ''
          ).trim(),

        animal:
          String(
            formData.get('animal') ||
            ''
          ).trim(),

        breed:
          String(
            formData.get('breed') ||
            ''
          ).trim(),

        color:
          String(
            formData.get('color') ||
            ''
          ).trim(),

        sex:
          String(
            formData.get('sex') ||
            ''
          ).trim(),

        age:
          String(
            formData.get('age') ||
            ''
          ).trim(),

        size:
          String(
            formData.get('size') ||
            ''
          ).trim(),

        identification:
          String(
            formData.get(
              'identification'
            ) ||
            ''
          ).trim(),

        microchip:
          String(
            formData.get(
              'microchip'
            ) ||
            ''
          ).trim(),

        neutering:
          String(
            formData.get(
              'neutering'
            ) ||
            ''
          ).trim(),

        distinctiveFeatures:
          String(
            formData.get(
              'distinctiveFeatures'
            ) ||
            ''
          ).trim(),

        date:
          String(
            formData.get('date') ||
            ''
          ).trim(),

        location:
          String(
            formData.get(
              'location'
            ) ||
            ''
          ).trim(),

        contact:
          String(
            formData.get(
              'contact'
            ) ||
            ''
          ).trim(),

        description:
          String(
            formData.get(
              'description'
            ) ||
            ''
          ).trim(),

        photo:
          reportPhotoData
      };


      /* =====================================================
         VALIDAR CAMPOS OBRIGATÓRIOS
      ===================================================== */

      if (
        !report.name ||
        !report.animal ||
        !report.location ||
        !report.description
      ) {

        showToast(
          'Preencha nome, espécie, localização e descrição.',
          'error'
        );

        return;
      }


      /* =====================================================
         BOTÃO DURANTE O ENVIO
      ===================================================== */

      const submitButton =
        reportForm.querySelector(
          'button[type="submit"]'
        );

      const originalButtonText =
        submitButton?.textContent;

     if (submitButton) {
  submitButton.disabled = true;

  submitButton.textContent =
    editingReportId
      ? 'Salvando alterações...'
      : 'Publicando...';
}


      /* =====================================================
         ENVIAR PARA O POSTGRESQL
      ===================================================== */

      try {

        const parsedEditingReportId =
  Number(editingReportId);

const isEditing =
  editingReportId !== null &&
  editingReportId !== '' &&
  Number.isSafeInteger(
    parsedEditingReportId
  ) &&
  parsedEditingReportId > 0;

const endpoint =
  isEditing
    ? `/api/my-publications/reports/${encodeURIComponent(
        String(parsedEditingReportId)
      )}`
    : '/api/reports';

const method =
  isEditing
    ? 'PATCH'
    : 'POST';

const result =
  await apiRequest(
    endpoint,
    {
      method,

      body:
        JSON.stringify(
          report
        )
    }
  );

        /* ===================================================
           MOSTRAR NOVA OCORRÊNCIA
        =================================================== */

        if (!result.report) {
  throw new Error(
    'O servidor não retornou a ocorrência.'
  );
}

if (isEditing) {

  await loadMyPublications();

  showToast(
    `${result.report.name} foi atualizado com sucesso!`
  );

} else {

  if (
    result.report.imageStatus === 'approved'
  ) {
    renderReport(
      result.report
    );
  }

  if (
    result.report.imageStatus === 'pending'
  ) {
    showToast(
      `${result.report.name} foi cadastrado. A foto está aguardando análise.`
    );
  } else {
    showToast(
      `${result.report.name} foi publicado com sucesso!`
    );
  }
}


        /* ===================================================
           LIMPAR FORMULÁRIO
        =================================================== */

        reportForm.reset();

        clearReportPhoto();

        editingReportId = null;


        /* ===================================================
           VOLTAR TIPO PARA PERDIDO
        =================================================== */

        selectedReportStatus =
          'perdido';

        document
          .querySelectorAll(
            '.report-type-button'
          )
          .forEach(
            (button) => {

              button.classList.toggle(
                'selected',

                button.dataset
                  .reportType ===
                  'perdido'
              );

            }
          );


        /* ===================================================
           FECHAR FORMULÁRIO
        =================================================== */

        closeReportModal();


        /* ===================================================
           ATUALIZAR FILTROS
        =================================================== */

        filterReports();


        /* ===================================================
           CONFIRMAÇÃO
        =================================================== */

        if (
  result.report?.imageStatus === 'pending'
) {
  showToast(
    'Ocorrência recebida. A foto está aguardando análise.'
  );
} else {
  showToast(
    'Ocorrência publicada com sucesso!'
  );
}


      } catch (error) {

        console.error(
          'Erro ao publicar ocorrência:',
          error
        );

        showToast(
          error.message ||
          'Não foi possível publicar a ocorrência.',
          'error'
        );


      } finally {

        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            originalButtonText ||
            '📢 Publicar ocorrência';

        }
      }
    }
  );
}

/* =========================================================
   PARCEIROS
========================================================= */

const partnerForm =
  document.querySelector(
    '#partner-form'
  );

const partnerList =
  document.querySelector(
    '#partner-list'
  );

const partnerReviewCount =
  document.querySelector(
    '#partner-review-count'
  );

const partnerApprovedCount =
  document.querySelector(
    '#partner-approved-count'
  );

/* =========================================================
   MOSTRAR PARCEIROS
========================================================= */

function renderPartners(
  partners
) {

  if (
    !Array.isArray(
      partners
    )
  ) {
    partners = [];
  }

  const reviewing =
    partners.filter(
      (partner) =>
        partner.status !==
        'aprovado'
    ).length;

  const approved =
    partners.filter(
      (partner) =>
        partner.status ===
        'aprovado'
    ).length;

  if (partnerReviewCount) {

    partnerReviewCount.textContent =
      String(reviewing);
  }

  if (partnerApprovedCount) {

    partnerApprovedCount.textContent =
      String(approved);
  }

  if (!partnerList) {
    return;
  }

  if (!partners.length) {

    partnerList.innerHTML = `
      <div class="partner-empty">
        Ainda não há parceiros cadastrados.
      </div>
    `;

    return;
  }

  partnerList.innerHTML =
    partners
      .map((partner) => {

        const approvedStatus =
          partner.status ===
          'aprovado';

        const statusText =
          approvedStatus
            ? 'Cadastro aprovado'
            : 'Cadastro em análise';

        const statusClass =
          approvedStatus
            ? 'approved'
            : 'reviewing';

        return `
          <div class="partner-item">

            <div
              class="partner-item-content"
            >

              <strong>
                ${escapeHtml(
                  partner.organization ||
                  'Parceiro'
                )}
              </strong>

              <small>

                ${escapeHtml(
                  partner.partnerType ||
                  'Parceiro'
                )}

                ·

                ${escapeHtml(
                  partner.location ||
                  'Local não informado'
                )}

              </small>

            </div>

            <span
              class="status-badge ${statusClass}"
            >
              ${statusText}
            </span>

          </div>
        `;
      })
      .join('');
}

/* =========================================================
   CARREGAR PARCEIROS
========================================================= */

async function loadPartners() {

  try {

    const result =
      await apiRequest(
        '/api/partners'
      );

    renderPartners(
      result.partners ||
      []
    );

  } catch (error) {

    console.error(
      'Erro ao carregar parceiros:',
      error
    );

    renderPartners([]);
  }
}

/* =========================================================
   LINKS DE TIPO DE PARCEIRO
========================================================= */

document
  .querySelectorAll(
    '[data-partner-type]'
  )
  .forEach((link) => {

    link.addEventListener(
      'click',
      () => {

        if (
          partnerForm?.elements
            .partnerType
        ) {

          partnerForm.elements
            .partnerType.value =
            link.dataset
              .partnerType;
        }
      }
    );
  });

/* =========================================================
   CADASTRAR PARCEIRO
========================================================= */

if (partnerForm) {

  partnerForm.addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();

      const partner =
        Object.fromEntries(
          new FormData(
            partnerForm
          )
        );

      if (
        !partner.organization ||
        !partner.partnerType ||
        !partner.phone ||
        !partner.location
      ) {

        showToast(
          'Preencha organização, tipo, telefone e localização.'
        );

        return;
      }

      const submitButton =
        partnerForm.querySelector(
          'button[type="submit"]'
        );

      if (submitButton) {
        submitButton.disabled = true;
      }

      try {

        await apiRequest(
          '/api/partners',
          {
            method: 'POST',

            body:
              JSON.stringify(
                partner
              )
          }
        );

        partnerForm.reset();

        await loadPartners();

        showToast(
          'Cadastro de parceiro enviado com sucesso!'
        );

      } catch (error) {

        showToast(
          error.message
        );

      } finally {

        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    }
  );
}

/* =========================================================
   MODERACAO DE IMAGENS
========================================================= */

const moderationSection =
  document.querySelector(
    '#moderacao'
  );

const moderationGrid =
  document.querySelector(
    '#moderation-grid'
  );

const moderationLoading =
  document.querySelector(
    '#moderation-loading'
  );

const moderationEmpty =
  document.querySelector(
    '#moderation-empty'
  );

const moderationError =
  document.querySelector(
    '#moderation-error'
  );

const moderationRefreshButton =
  document.querySelector(
    '#moderation-refresh'
  );

const moderationDecisionModal =
  document.querySelector(
    '#moderation-decision-modal'
  );

const moderationDecisionClose =
  document.querySelector(
    '.moderation-decision-close'
  );

const moderationDecisionPetName =
  document.querySelector(
    '#moderation-decision-pet-name'
  );

const moderationDecisionType =
  document.querySelector(
    '#moderation-decision-type'
  );

const moderationDecisionReason =
  document.querySelector(
    '#moderation-decision-reason'
  );

const moderationDecisionEntityType =
  document.querySelector(
    '#moderation-decision-entity-type'
  );

const moderationDecisionEntityId =
  document.querySelector(
    '#moderation-decision-entity-id'
  );

const moderationApproveButton =
  document.querySelector(
    '#moderation-approve'
  );

const moderationReviewButton =
  document.querySelector(
    '#moderation-review'
  );

const moderationBlockButton =
  document.querySelector(
    '#moderation-block'
  );


let moderationSelectedStatus =
  'pending';

let moderationSelectedType =
  'all';

  /* =========================================================
   CARREGAR FILA DE MODERACAO
========================================================= */

async function loadModerationQueue() {
  if (
    !moderationSection ||
    !moderationGrid
  ) {
    return;
  }

  if (moderationLoading) {
    moderationLoading.hidden = false;
  }

  if (moderationEmpty) {
    moderationEmpty.hidden = true;
  }

  if (moderationError) {
    moderationError.hidden = true;
  }

  moderationGrid.innerHTML = '';

  try {
    const result =
      await apiRequest(
        `/api/moderation/images?status=${encodeURIComponent(
          moderationSelectedStatus
        )}&type=${encodeURIComponent(
          moderationSelectedType
        )}`
      );

    const items =
      Array.isArray(result.items)
        ? result.items
        : [];

    if (!items.length) {
      if (moderationEmpty) {
        moderationEmpty.hidden = false;
      }

      return;
    }

    items.forEach(
      (item) => {
        renderModerationItem(item);
      }
    );

  } catch (error) {
    console.error(
      'Erro ao carregar moderação:',
      error
    );

    if (moderationError) {
      moderationError.textContent =
        error.message ||
        'Não foi possível carregar a fila de moderação.';

      moderationError.hidden = false;
    }

  } finally {
    if (moderationLoading) {
      moderationLoading.hidden = true;
    }
  }
}

/* =========================================================
   CRIAR CARD DA FILA DE MODERACAO
========================================================= */

function renderModerationItem(item) {
  if (
    !moderationGrid ||
    !item
  ) {
    return;
  }

  const entityType =
    item.entityType === 'report'
      ? 'report'
      : 'pet';

  const typeLabel =
    entityType === 'pet'
      ? 'Adoção'
      : 'Achados e perdidos';

  const status =
    item.imageStatus ||
    'pending';

  const statusLabels = {
    pending: 'Pendente',
    review: 'Em revisão',
    approved: 'Aprovada',
    blocked: 'Bloqueada'
  };

  const statusLabel =
    statusLabels[status] ||
    'Pendente';


  /* =====================================================
     FOTO
  ===================================================== */

  const photo =
    typeof item.photo === 'string'
      ? item.photo.trim()
      : '';

  const validPhoto =
    photo.startsWith('data:image/') ||
    photo.startsWith('https://');

  const photoHtml =
    validPhoto
      ? `
        <img
          src="${escapeHtml(photo)}"
          alt="Imagem enviada para moderação"
        >
      `
      : `
        <div class="moderation-item-placeholder">
          🐾
        </div>
      `;


  /* =====================================================
     RESPONSAVEL / CONTATO
  ===================================================== */

  const responsible =
    item.userName ||
    item.userEmail ||
    'Não informado';


  /* =====================================================
     DATA
  ===================================================== */

  let createdAt =
    'Data não informada';

  if (item.createdAt) {
    const date =
      new Date(
        item.createdAt
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      createdAt =
        date.toLocaleDateString(
          'pt-BR'
        );
    }
  }


  /* =====================================================
     MOTIVO
  ===================================================== */

  const reasonHtml =
    item.imageModerationReason
      ? `
        <div class="moderation-item-reason">
          <strong>
            Motivo:
          </strong>

          ${escapeHtml(
            item.imageModerationReason
          )}
        </div>
      `
      : '';


  /* =====================================================
     CRIAR CARD
  ===================================================== */

  const card =
    document.createElement(
      'article'
    );

  card.className =
    'moderation-item';

  card.dataset.entityType =
    entityType;

  card.dataset.entityId =
    String(
      item.id
    );


  card.innerHTML = `
    <div class="moderation-item-image">

      ${photoHtml}

      <span
        class="moderation-status moderation-status-${escapeHtml(
          status
        )}"
      >
        ${escapeHtml(
          statusLabel
        )}
      </span>

    </div>


    <div class="moderation-item-body">

      <span class="moderation-item-type">
        ${escapeHtml(
          typeLabel
        )}
      </span>


      <h3>
        ${escapeHtml(
          item.name ||
          'Animal'
        )}
      </h3>


      <div class="moderation-item-info">

        <p>
          <strong>Espécie:</strong>
          ${escapeHtml(
            item.animalType ||
            'Não informada'
          )}
        </p>

        <p>
          <strong>Localização:</strong>
          ${escapeHtml(
            item.location ||
            'Não informada'
          )}
        </p>

        <p>
          <strong>Responsável / contato:</strong>
          ${escapeHtml(
            responsible
          )}
        </p>

        <p>
          <strong>Enviado em:</strong>
          ${escapeHtml(
            createdAt
          )}
        </p>

      </div>


      ${reasonHtml}


      <div class="moderation-item-actions">

        <button
          class="moderation-card-approve"
          type="button"
        >
          ✓ Aprovar
        </button>

        <button
          class="moderation-card-review"
          type="button"
        >
          Revisar
        </button>

      </div>

    </div>
  `;


  /* =====================================================
     APROVAR DIRETAMENTE
  ===================================================== */

  const approveButton =
    card.querySelector(
      '.moderation-card-approve'
    );

  if (approveButton) {
    approveButton.addEventListener(
      'click',
      () => {
        moderateImage(
          entityType,
          item.id,
          'approved',
          ''
        );
      }
    );
  }


  /* =====================================================
     ABRIR MODAL PARA REVISAO / BLOQUEIO
  ===================================================== */

  const reviewButton =
    card.querySelector(
      '.moderation-card-review'
    );

  if (reviewButton) {
    reviewButton.addEventListener(
      'click',
      () => {
        openModerationDecision(
          item
        );
      }
    );
  }


  moderationGrid.appendChild(
    card
  );
}

/* =========================================================
   ABRIR MODAL DE DECISAO DA MODERACAO
========================================================= */

function openModerationDecision(item) {
  if (
    !moderationDecisionModal ||
    !item
  ) {
    return;
  }

  const entityType =
    item.entityType === 'report'
      ? 'report'
      : 'pet';

  const typeLabel =
    entityType === 'pet'
      ? 'Adoção'
      : 'Achados e perdidos';


  if (moderationDecisionPetName) {
    moderationDecisionPetName.textContent =
      item.name ||
      'Animal';
  }


  if (moderationDecisionType) {
    moderationDecisionType.textContent =
      typeLabel;
  }


  if (moderationDecisionReason) {
    moderationDecisionReason.value =
      item.imageModerationReason ||
      '';
  }


  if (moderationDecisionEntityType) {
    moderationDecisionEntityType.value =
      entityType;
  }


  if (moderationDecisionEntityId) {
    moderationDecisionEntityId.value =
      String(
        item.id
      );
  }


  moderationDecisionModal.classList.add(
    'open'
  );

  moderationDecisionModal.setAttribute(
    'aria-hidden',
    'false'
  );


  window.setTimeout(
    () => {
      moderationDecisionReason?.focus();
    },
    50
  );
}


/* =========================================================
   FECHAR MODAL DE DECISAO
========================================================= */

function closeModerationDecision() {
  if (!moderationDecisionModal) {
    return;
  }

  moderationDecisionModal.classList.remove(
    'open'
  );

  moderationDecisionModal.setAttribute(
    'aria-hidden',
    'true'
  );


  if (moderationDecisionReason) {
    moderationDecisionReason.value = '';
  }


  if (moderationDecisionEntityType) {
    moderationDecisionEntityType.value = '';
  }


  if (moderationDecisionEntityId) {
    moderationDecisionEntityId.value = '';
  }
}


/* =========================================================
   BOTAO FECHAR
========================================================= */

if (moderationDecisionClose) {
  moderationDecisionClose.addEventListener(
    'click',
    closeModerationDecision
  );
}


/* =========================================================
   FECHAR CLICANDO NO FUNDO
========================================================= */

if (moderationDecisionModal) {
  moderationDecisionModal.addEventListener(
    'click',
    (event) => {
      if (
        event.target ===
        moderationDecisionModal
      ) {
        closeModerationDecision();
      }
    }
  );
}

/* =========================================================
   EXECUTAR DECISAO DE MODERACAO
========================================================= */

async function moderateImage(
  entityType,
  entityId,
  status,
  reason = ''
) {
  const allowedTypes = [
    'pet',
    'report'
  ];

  const allowedStatuses = [
    'approved',
    'review',
    'blocked'
  ];


  /* =====================================================
     VALIDAR DADOS
  ===================================================== */

  if (
    !allowedTypes.includes(
      entityType
    )
  ) {
    showToast(
      'Tipo de publicação inválido.',
      'error'
    );

    return;
  }


  const numericId =
    Number(entityId);

  if (
    !Number.isSafeInteger(
      numericId
    ) ||
    numericId <= 0
  ) {
    showToast(
      'Identificador da publicação inválido.',
      'error'
    );

    return;
  }


  if (
    !allowedStatuses.includes(
      status
    )
  ) {
    showToast(
      'Decisão de moderação inválida.',
      'error'
    );

    return;
  }


  const cleanReason =
    String(
      reason || ''
    ).trim();


  if (
    status !== 'approved' &&
    !cleanReason
  ) {
    showToast(
      'Informe o motivo da revisão ou do bloqueio.',
      'error'
    );

    moderationDecisionReason?.focus();

    return;
  }


  /* =====================================================
     DESABILITAR BOTOES
  ===================================================== */

  const actionButtons = [
    moderationApproveButton,
    moderationReviewButton,
    moderationBlockButton
  ];


  actionButtons.forEach(
    (button) => {
      if (button) {
        button.disabled = true;
      }
    }
  );


  try {

    /* ===================================================
       ENVIAR DECISAO AO BACKEND
    =================================================== */

    const result =
      await apiRequest(
        `/api/moderation/images/${encodeURIComponent(
          entityType
        )}/${encodeURIComponent(
          String(numericId)
        )}`,
        {
          method: 'PATCH',

          body:
            JSON.stringify({
              status,
              reason:
                cleanReason
            })
        }
      );


    /* ===================================================
       FECHAR MODAL
    =================================================== */

    closeModerationDecision();


    /* ===================================================
       CONFIRMACAO
    =================================================== */

    showToast(
      result.message ||
      (
        status === 'approved'
          ? 'Imagem aprovada com sucesso.'
          : status === 'blocked'
            ? 'Imagem bloqueada com sucesso.'
            : 'Imagem enviada para revisão.'
      )
    );


    /* ===================================================
       ATUALIZAR FILA
    =================================================== */

    await refreshModerationPanel();

  } catch (error) {

    console.error(
      'Erro ao moderar imagem:',
      error
    );

    showToast(
      error.message ||
      'Não foi possível concluir a moderação.',
      'error'
    );

  } finally {

    actionButtons.forEach(
      (button) => {
        if (button) {
          button.disabled = false;
        }
      }
    );
  }
}

/* =========================================================
   CONECTAR BOTOES DO MODAL DE MODERACAO
========================================================= */

/* =========================================================
   APROVAR
========================================================= */

if (moderationApproveButton) {
  moderationApproveButton.addEventListener(
    'click',
    async () => {
      const entityType =
        moderationDecisionEntityType?.value;

      const entityId =
        moderationDecisionEntityId?.value;

      await moderateImage(
        entityType,
        entityId,
        'approved',
        ''
      );
    }
  );
}


/* =========================================================
   ENVIAR PARA REVISAO
========================================================= */

if (moderationReviewButton) {
  moderationReviewButton.addEventListener(
    'click',
    async () => {
      const entityType =
        moderationDecisionEntityType?.value;

      const entityId =
        moderationDecisionEntityId?.value;

      const reason =
        moderationDecisionReason?.value ||
        '';

      await moderateImage(
        entityType,
        entityId,
        'review',
        reason
      );
    }
  );
}


/* =========================================================
   BLOQUEAR
========================================================= */

if (moderationBlockButton) {
  moderationBlockButton.addEventListener(
    'click',
    async () => {
      const entityType =
        moderationDecisionEntityType?.value;

      const entityId =
        moderationDecisionEntityId?.value;

      const reason =
        moderationDecisionReason?.value ||
        '';

      await moderateImage(
        entityType,
        entityId,
        'blocked',
        reason
      );
    }
  );
}

/* =========================================================
   FILTROS DA FILA DE MODERACAO
========================================================= */

const moderationStatusButtons = [
  ...document.querySelectorAll(
    '[data-moderation-status]'
  )
];

const moderationTypeButtons = [
  ...document.querySelectorAll(
    '[data-moderation-type]'
  )
];


/* =========================================================
   FILTRAR POR STATUS
========================================================= */

moderationStatusButtons.forEach(
  (button) => {
    button.addEventListener(
      'click',
      async () => {
        const status =
          button.dataset.moderationStatus;

        if (!status) {
          return;
        }

        moderationSelectedStatus =
          status;

        moderationStatusButtons.forEach(
          (item) => {
            item.classList.toggle(
              'active',
              item === button
            );
          }
        );

        await loadModerationQueue();
      }
    );
  }
);


/* =========================================================
   FILTRAR POR TIPO
========================================================= */

moderationTypeButtons.forEach(
  (button) => {
    button.addEventListener(
      'click',
      async () => {
        const type =
          button.dataset.moderationType;

        if (!type) {
          return;
        }

        moderationSelectedType =
          type;

        moderationTypeButtons.forEach(
          (item) => {
            item.classList.toggle(
              'active',
              item === button
            );
          }
        );

        await loadModerationQueue();
      }
    );
  }
);


/* =========================================================
   ATUALIZAR FILA
========================================================= */

if (moderationRefreshButton) {
  moderationRefreshButton.addEventListener(
    'click',
    async () => {
      moderationRefreshButton.disabled =
        true;

      const originalText =
        moderationRefreshButton.textContent;

      moderationRefreshButton.textContent =
        '↻ Atualizando...';

      try {
        await loadModerationQueue();

        showToast(
          'Fila de moderação atualizada.'
        );

      } finally {
        moderationRefreshButton.disabled =
          false;

        moderationRefreshButton.textContent =
          originalText;
      }
    }
  );
}

/* =========================================================
   CONTADORES DA MODERACAO
========================================================= */

const moderationPendingCount =
  document.querySelector(
    '#moderation-pending-count'
  );

const moderationReviewCount =
  document.querySelector(
    '#moderation-review-count'
  );

const moderationApprovedCount =
  document.querySelector(
    '#moderation-approved-count'
  );

const moderationBlockedCount =
  document.querySelector(
    '#moderation-blocked-count'
  );


/* =========================================================
   ATUALIZAR CONTADORES
========================================================= */

async function updateModerationCounts() {
  if (!moderationSection) {
    return;
  }

  const statuses = [
    {
      status: 'pending',
      element: moderationPendingCount
    },
    {
      status: 'review',
      element: moderationReviewCount
    },
    {
      status: 'approved',
      element: moderationApprovedCount
    },
    {
      status: 'blocked',
      element: moderationBlockedCount
    }
  ];


  await Promise.all(
    statuses.map(
      async ({
        status,
        element
      }) => {
        if (!element) {
          return;
        }

        try {
          const result =
            await apiRequest(
              `/api/moderation/images?status=${encodeURIComponent(
                status
              )}&type=all`
            );

          const items =
            Array.isArray(result.items)
              ? result.items
              : [];

          element.textContent =
            String(
              items.length
            );

        } catch (error) {
          console.error(
            `Erro ao contar imagens ${status}:`,
            error
          );

          element.textContent = '0';
        }
      }
    )
  );
}


/* =========================================================
   ATUALIZAR PAINEL COMPLETO
========================================================= */

async function refreshModerationPanel() {
  await Promise.all([
    loadModerationQueue(),
    updateModerationCounts()
  ]);
}


/* =========================================================
   INICIALIZAR PAINEL DE MODERACAO
========================================================= */

async function initializeModerationPanel() {
  if (!moderationSection) {
    return;
  }

  moderationSection.hidden = true;

  moderationSelectedStatus =
    'pending';

  moderationSelectedType =
    'all';

  moderationStatusButtons.forEach(
    (button) => {
      button.classList.toggle(
        'active',
        button.dataset.moderationStatus ===
          'pending'
      );
    }
  );

  moderationTypeButtons.forEach(
    (button) => {
      button.classList.toggle(
        'active',
        button.dataset.moderationType ===
          'all'
      );
    }
  );

  try {
    /*
     * A própria rota protegida confirma
     * se a sessão atual pertence a um admin.
     */
    await apiRequest(
      '/api/moderation/images?status=pending&type=all'
    );

    /*
     * Se chegou até aqui, o backend
     * autorizou a conta.
     */
    moderationSection.hidden = false;

    await refreshModerationPanel();

  } catch (error) {
    /*
     * Usuário comum continua sem visualizar
     * o painel administrativo.
     */
    moderationSection.hidden = true;

    console.log(
      'Painel de moderação não disponível para esta conta.'
    );
  }
}

initializeModerationPanel();

/* =========================================================
   INICIALIZAÇÃO DAS INFORMAÇÕES DA API
========================================================= */
const savedUser = getSavedUser();

if (savedUser) {
  showLoggedUser(savedUser);
}

loadReports();
loadPartners();
loadPets();
/* =========================================================
   FECHAR MODAIS COM ESC
========================================================= */

document.addEventListener(
  'keydown',
  (event) => {

    if (event.key !== 'Escape') {
      return;
    }

    closeDonationModal();
    closeAdoptionModal();
    closeReportModal();
    closePetDetails();
    closePetRegisterModal();
    closeNavMore();
  }
);

/* =========================================================
   EVITAR ENVIO DUPLO DE FORMULÁRIOS
========================================================= */

document
  .querySelectorAll('form')
  .forEach((form) => {

    form.addEventListener(
      'submit',
      () => {

        const submitButton =
          form.querySelector(
            'button[type="submit"]'
          );

        if (!submitButton) {
          return;
        }

        /*
         * Alguns formulários já controlam o disabled
         * individualmente. Esta verificação evita
         * interferência nesses casos.
         */

        if (
          form.id === 'auth-form' ||
          form.id === 'adoption-form' ||
          form.id === 'report-form' ||
          form.id === 'partner-form'
        ) {
          return;
        }
      }
    );
  });

/* =========================================================
   TRATAMENTO DE LINKS INTERNOS
========================================================= */

document
  .querySelectorAll(
    'a[href^="#"]'
  )
  .forEach((link) => {

    link.addEventListener(
      'click',
      () => {

        if (
          mainNav &&
          mainNav.classList.contains(
            'open'
          )
        ) {

          mainNav.classList.remove(
            'open'
          );
        }

        closeNavMore();
      }
    );
  });

/* =========================================================
   ESTADO DOS BOTÕES DURANTE REQUISIÇÕES
========================================================= */

function setButtonLoading(
  button,
  loading,
  loadingText = 'Aguarde...'
) {

  if (!button) {
    return;
  }

  if (loading) {

    if (
      !button.dataset
        .originalText
    ) {

      button.dataset.originalText =
        button.textContent;
    }

    button.disabled = true;

    button.textContent =
      loadingText;

  } else {

    button.disabled = false;

    if (
      button.dataset
        .originalText
    ) {

      button.textContent =
        button.dataset
          .originalText;

      delete button.dataset
        .originalText;
    }
  }
}

/* =========================================================
   VERIFICAR DISPONIBILIDADE DO BACKEND
========================================================= */

async function checkApiHealth() {

  try {

    const result =
      await apiRequest(
        '/api/health'
      );

    if (result.ok) {

      console.log(
        'NeoPetCare API conectada.'
      );

      return true;
    }

    console.warn(
      'A API respondeu, mas não confirmou o estado esperado.'
    );

    return false;

  } catch (error) {

    console.error(
      'Não foi possível conectar à API:',
      error
    );

    return false;
  }
}

/* =========================================================
   MELHORIAS DE ACESSIBILIDADE DOS MODAIS
========================================================= */

function focusFirstModalElement(
  modal
) {

  if (!modal) {
    return;
  }

  const element =
    modal.querySelector(
      `
        button:not([disabled]),
        input:not([disabled]),
        select:not([disabled]),
        textarea:not([disabled])
      `
    );

  if (element) {

    window.setTimeout(
      () => {
        element.focus();
      },
      50
    );
  }
}

/* =========================================================
   FOCO AO ABRIR MODAL DE ADOÇÃO
========================================================= */

document
  .querySelectorAll(
    '.adoption-button'
  )
  .forEach((button) => {

    button.addEventListener(
      'click',
      () => {

        focusFirstModalElement(
          adoptionModal
        );
      }
    );
  });

/* =========================================================
   FOCO AO ABRIR MODAL DE OCORRÊNCIA
========================================================= */

document
  .querySelectorAll(
    '.open-report'
  )
  .forEach((button) => {

    button.addEventListener(
      'click',
      () => {

        focusFirstModalElement(
          reportModal
        );
      }
    );
  });

/* =========================================================
   FOCO AO ABRIR MODAL DE DOAÇÃO
========================================================= */

document
  .querySelectorAll(
    '.open-donation'
  )
  .forEach((button) => {

    button.addEventListener(
      'click',
      () => {

        focusFirstModalElement(
          donationModal
        );
      }
    );
  });

/* =========================================================
   PROTEÇÃO CONTRA ERROS NÃO TRATADOS
========================================================= */

window.addEventListener(
  'unhandledrejection',
  (event) => {

    console.error(
      'Erro assíncrono não tratado:',
      event.reason
    );
  }
);

window.addEventListener(
  'error',
  (event) => {

    console.error(
      'Erro no frontend:',
      event.error ||
      event.message
    );
  }
);

/* =========================================================
   MINHAS PUBLICACOES
========================================================= */

const myPublicationsSection =
  document.querySelector(
    '#minhas-publicacoes'
  );

const myPublicationsRefresh =
  document.querySelector(
    '#my-publications-refresh'
  );

const myPublicationsLoading =
  document.querySelector(
    '#my-publications-loading'
  );

const myPublicationsError =
  document.querySelector(
    '#my-publications-error'
  );

const myPublicationsPetsGrid =
  document.querySelector(
    '#my-publications-pets-grid'
  );

const myPublicationsReportsGrid =
  document.querySelector(
    '#my-publications-reports-grid'
  );

  const myPublicationsClosedGrid =
  document.querySelector(
    '#my-publications-closed-grid'
  );

const myPublicationsClosedCount =
  document.querySelector(
    '#my-publications-closed-count'
  );

const myPublicationsClosedEmpty =
  document.querySelector(
    '#my-publications-closed-empty'
  );

const myPublicationsClosedPanel =
  document.querySelector(
    '#my-publications-closed'
  );

const myPublicationsPetsEmpty =
  document.querySelector(
    '#my-publications-pets-empty'
  );

const myPublicationsReportsEmpty =
  document.querySelector(
    '#my-publications-reports-empty'
  );

const myPublicationsPetsCount =
  document.querySelector(
    '#my-publications-pets-count'
  );

const myPublicationsReportsCount =
  document.querySelector(
    '#my-publications-reports-count'
  );

const myPublicationsPetsPanel =
  document.querySelector(
    '#my-publications-pets'
  );

const myPublicationsReportsPanel =
  document.querySelector(
    '#my-publications-reports'
  );

const myPublicationsTabs = [
  ...document.querySelectorAll(
    '[data-publication-tab]'
  )
];

const myPublicationsWikiGrid =
  document.querySelector(
    '#my-publications-wiki-grid'
  );

const myPublicationsWikiCount =
  document.querySelector(
    '#my-publications-wiki-count'
  );

const myPublicationsWikiEmpty =
  document.querySelector(
    '#my-publications-wiki-empty'
  );

const myPublicationsWikiPanel =
  document.querySelector(
    '#my-publications-wiki'
  );

const myPublicationsWikiCreate =
  document.querySelector(
    '#my-publications-wiki-create'
  );

/* =========================================================
   CARREGAR MINHAS PUBLICACOES
========================================================= */

async function loadMyPublications() {
  function hideMyPublications() {
  if (myPublicationsSection) {
    myPublicationsSection.hidden = true;
  }

  if (myPublicationsPetsGrid) {
    myPublicationsPetsGrid.innerHTML = '';
  }

  if (myPublicationsReportsGrid) {
    myPublicationsReportsGrid.innerHTML = '';
  }

  if (myPublicationsPetsCount) {
    myPublicationsPetsCount.textContent = '0';
  }

  if (myPublicationsReportsCount) {
    myPublicationsReportsCount.textContent = '0';
  }

  if (myPublicationsPetsEmpty) {
    myPublicationsPetsEmpty.hidden = true;
  }

  if (myPublicationsReportsEmpty) {
    myPublicationsReportsEmpty.hidden = true;
  }

  if (myPublicationsError) {
    myPublicationsError.hidden = true;
  }
}

  if (
    !myPublicationsSection ||
    !myPublicationsPetsGrid ||
    !myPublicationsReportsGrid
  ) {
    return;
  }

  if (myPublicationsLoading) {
    myPublicationsLoading.hidden = false;
  }

  if (myPublicationsError) {
    myPublicationsError.hidden = true;
  }

  if (myPublicationsPetsEmpty) {
    myPublicationsPetsEmpty.hidden = true;
  }

  if (myPublicationsReportsEmpty) {
    myPublicationsReportsEmpty.hidden = true;
  }

  if (myPublicationsWikiCreate) {
  myPublicationsWikiCreate.addEventListener(
    'click',
    openWikiCreateModal
  );
}

  try {
    const result =
      await apiRequest(
        '/api/my-publications'
      );

    const pets =
  Array.isArray(result.pets)
    ? result.pets
    : [];

const reports =
  Array.isArray(result.reports)
    ? result.reports
    : [];

    const wiki =
  Array.isArray(result.wiki)
    ? result.wiki
    : [];

/* =====================================================
   SEPARAR ATIVAS E ENCERRADAS
===================================================== */

const activePets =
  pets.filter(
    (pet) =>
      pet.status !== 'adotado'
  );

const closedPets =
  pets.filter(
    (pet) =>
      pet.status === 'adotado'
  );

const activeReports =
  reports.filter(
    (report) =>
      report.publicationStatus !==
      'resolved'
  );

const closedReports =
  reports.filter(
    (report) =>
      report.publicationStatus ===
      'resolved'
  );

  const activeWiki =
  wiki.filter(
    (article) =>
      article.publicationStatus !==
      'archived'
  );

const closedWiki =
  wiki.filter(
    (article) =>
      article.publicationStatus ===
      'archived'
  );

const closedCount =
  closedPets.length +
  closedReports.length +
  closedWiki.length;


/* =====================================================
   MOSTRAR AREA
===================================================== */

myPublicationsSection.hidden = false;


/* =====================================================
   CONTADORES
===================================================== */

if (myPublicationsPetsCount) {
  myPublicationsPetsCount.textContent =
    String(activePets.length);
}

if (myPublicationsReportsCount) {
  myPublicationsReportsCount.textContent =
    String(activeReports.length);
}

if (myPublicationsWikiCount) {
  myPublicationsWikiCount.textContent =
    String(activeWiki.length);
}

if (myPublicationsClosedCount) {
  myPublicationsClosedCount.textContent =
    String(closedCount);
}


/* =====================================================
   LIMPAR GRADES
===================================================== */

myPublicationsPetsGrid.innerHTML = '';
myPublicationsReportsGrid.innerHTML = '';

if (myPublicationsWikiGrid) {
  myPublicationsWikiGrid.innerHTML = '';
}

if (myPublicationsClosedGrid) {
  myPublicationsClosedGrid.innerHTML = '';
}


/* =====================================================
   ANIMAIS ATIVOS
===================================================== */

activePets.forEach(
  (pet) => {
    renderMyPetPublication(
      pet
    );
  }
);


/* =====================================================
   OCORRENCIAS ATIVAS
===================================================== */

activeReports.forEach(
  (report) => {
    renderMyReportPublication(
      report
    );
  }
);

/* =====================================================
   ARTIGOS ATIVOS DA WIKIPET
===================================================== */

activeWiki.forEach(
  (article) => {
    renderMyWikiPublication(
      article
    );
  }
);

/* =====================================================
   PUBLICACOES ENCERRADAS
===================================================== */

closedPets.forEach(
  (pet) => {
    renderMyPetPublication(
      pet,
      myPublicationsClosedGrid
    );
  }
);

closedReports.forEach(
  (report) => {
    renderMyReportPublication(
      report,
      myPublicationsClosedGrid
    );
  }
);

closedWiki.forEach(
  (article) => {
    renderMyWikiPublication(
      article,
      myPublicationsClosedGrid
    );
  }
);

/* =====================================================
   ESTADOS VAZIOS
===================================================== */

if (myPublicationsPetsEmpty) {
  myPublicationsPetsEmpty.hidden =
    activePets.length > 0;
}

if (myPublicationsReportsEmpty) {
  myPublicationsReportsEmpty.hidden =
    activeReports.length > 0;
}

if (myPublicationsClosedEmpty) {
  myPublicationsClosedEmpty.hidden =
    closedCount > 0;
}

if (myPublicationsWikiEmpty) {
  myPublicationsWikiEmpty.hidden =
    activeWiki.length > 0;
}

  } catch (error) {
    console.error(
      'Erro ao carregar minhas publicações:',
      error
    );

    myPublicationsSection.hidden = true;

    if (myPublicationsError) {
      myPublicationsError.textContent =
        error.message ||
        'Não foi possível carregar suas publicações.';

      myPublicationsError.hidden = false;
    }

  } finally {
    if (myPublicationsLoading) {
      myPublicationsLoading.hidden = true;
    }
  }
}

/* =========================================================
   INICIALIZAR MINHAS PUBLICACOES
========================================================= */

async function initializeMyPublications() {
  if (!myPublicationsSection) {
    return;
  }

  myPublicationsSection.hidden = true;

  setMyPublicationsTab(
    'pets'
  );

  const savedUser =
    getSavedUser();

  if (!savedUser) {
    return;
  }

  await loadMyPublications();
}

/* =========================================================
   ABAS - MINHAS PUBLICACOES
========================================================= */

function setMyPublicationsTab(selectedTab) {
  const showPets =
    selectedTab === 'pets';

  const showReports =
    selectedTab === 'reports';

  const showWiki =
    selectedTab === 'wiki';

  const showClosed =
    selectedTab === 'closed';

  if (myPublicationsPetsPanel) {
    myPublicationsPetsPanel.hidden =
      !showPets;
  }

  if (myPublicationsReportsPanel) {
    myPublicationsReportsPanel.hidden =
      !showReports;
  }

  if (myPublicationsWikiPanel) {
    myPublicationsWikiPanel.hidden =
      !showWiki;
  }

  if (myPublicationsClosedPanel) {
    myPublicationsClosedPanel.hidden =
      !showClosed;
  }

  myPublicationsTabs.forEach(
    (button) => {
      const isActive =
        button.dataset.publicationTab ===
        selectedTab;

      button.classList.toggle(
        'active',
        isActive
      );

      button.setAttribute(
        'aria-selected',
        String(isActive)
      );
    }
  );
}

initializeMyPublications();

/* =========================================================
   CARD - MEU ANIMAL
========================================================= */
/* =========================================================
   CARD - MEU ARTIGO DA WIKIPET
========================================================= */

function renderMyWikiPublication(
  article,
  targetGrid = myPublicationsWikiGrid
) {
  if (
    !targetGrid ||
    !article
  ) {
    return;
  }

  const categoryLabels = {
    saude: 'Saúde',
    cuidados: 'Cuidados',
    adocao: 'Adoção'
  };

  const categoryClasses = {
    saude: 'category-health',
    cuidados: 'category-care',
    adocao: 'category-adoption'
  };

  const category =
    article.category ||
    'cuidados';

  const categoryLabel =
    categoryLabels[category] ||
    'Cuidados';

  const categoryClass =
    categoryClasses[category] ||
    'category-care';

  const publicationStatus =
    article.publicationStatus ||
    'active';

  const statusLabel =
    publicationStatus === 'archived'
      ? 'Arquivado'
      : 'Publicado';

  let createdAt =
    'Data não informada';

  if (article.createdAt) {
    const date =
      new Date(
        article.createdAt
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      createdAt =
        date.toLocaleDateString(
          'pt-BR'
        );
    }
  }

  const archiveButtonHtml =
    publicationStatus === 'active'
      ? `
        <button
          class="my-publication-wiki-archive"
          type="button"
        >
          📦 Arquivar
        </button>
      `
      : '';

  const card =
    document.createElement(
      'article'
    );

  card.className =
    'my-publication-card';

  card.dataset.articleId =
    String(
      article.id
    );

  card.innerHTML = `
    <div class="my-publication-body">

      <span class="my-publication-type">
        📚 WikiPet
      </span>

      <span
        class="wiki-category ${categoryClass}"
      >
        ${escapeHtml(
          categoryLabel
        )}
      </span>

      <h3>
        ${escapeHtml(
          article.title ||
          'Artigo'
        )}
      </h3>

      <div class="my-publication-info">

        <p>
          <strong>Categoria:</strong>
          ${escapeHtml(
            categoryLabel
          )}
        </p>

        <p>
          <strong>Publicado em:</strong>
          ${escapeHtml(
            createdAt
          )}
        </p>

        <p>
          <strong>Status:</strong>
          ${escapeHtml(
            statusLabel
          )}
        </p>

      </div>

      <p class="my-publication-description">
        ${escapeHtml(
          article.summary ||
          ''
        )}
      </p>

      <div class="my-publication-actions">

        <button
          class="my-publication-wiki-edit"
          type="button"
        >
          ✏️ Editar
        </button>

        ${archiveButtonHtml}

        <button
          class="my-publication-wiki-delete"
          type="button"
        >
          🗑 Excluir
        </button>

      </div>

    </div>
  `;


  /* =====================================================
     BOTAO - EDITAR ARTIGO
  ===================================================== */

  const editButton =
    card.querySelector(
      '.my-publication-wiki-edit'
    );

  if (editButton) {
    editButton.addEventListener(
      'click',
      () => {
        openWikiEditModal(
          article
        );
      }
    );
  }


  /* =====================================================
     BOTAO - ARQUIVAR ARTIGO
  ===================================================== */

  const archiveButton =
    card.querySelector(
      '.my-publication-wiki-archive'
    );

  if (archiveButton) {
    archiveButton.addEventListener(
      'click',
      async () => {
        const confirmed =
          window.confirm(
            `Deseja arquivar o artigo "${article.title || 'Artigo'}"?`
          );

        if (!confirmed) {
          return;
        }

        archiveButton.disabled =
          true;

        try {
          const result =
            await apiRequest(
              `/api/wiki/${encodeURIComponent(
                String(article.id)
              )}/status`,
              {
                method: 'PATCH',
                body:
                  JSON.stringify({})
              }
            );

          showToast(
            result.message ||
            'Artigo arquivado com sucesso.'
          );

          await loadWikiArticles();

          await loadMyPublications();

        } catch (error) {
          showToast(
            error.message ||
            'Não foi possível arquivar o artigo.',
            'error'
          );

        } finally {
          archiveButton.disabled =
            false;
        }
      }
    );
  }


  /* =====================================================
     BOTAO - EXCLUIR ARTIGO
  ===================================================== */

  const deleteButton =
    card.querySelector(
      '.my-publication-wiki-delete'
    );

  if (deleteButton) {
    deleteButton.addEventListener(
      'click',
      async () => {
        const confirmed =
          window.confirm(
            `Tem certeza de que deseja excluir definitivamente o artigo "${article.title || 'Artigo'}"?`
          );

        if (!confirmed) {
          return;
        }

        deleteButton.disabled =
          true;

        try {
          const result =
            await apiRequest(
              `/api/wiki/${encodeURIComponent(
                String(article.id)
              )}`,
              {
                method: 'DELETE',
                body:
                  JSON.stringify({})
              }
            );

          showToast(
            result.message ||
            'Artigo excluído com sucesso.'
          );

          await loadWikiArticles();

          await loadMyPublications();

        } catch (error) {
          showToast(
            error.message ||
            'Não foi possível excluir o artigo.',
            'error'
          );

        } finally {
          deleteButton.disabled =
            false;
        }
      }
    );
  }

  targetGrid.appendChild(
    card
  );
}

function renderMyPetPublication(
  pet,
  targetGrid = myPublicationsPetsGrid
) {
  if (
    !myPublicationsPetsGrid ||
    !pet
  ) {
    return;
  }

  const imageStatus =
    pet.imageStatus ||
    'approved';

  const moderationLabels = {
    pending: 'Aguardando análise',
    review: 'Em revisão',
    approved: 'Publicada',
    blocked: 'Foto bloqueada'
  };

  const moderationLabel =
    moderationLabels[imageStatus] ||
    'Status não informado';


  const adoptionLabels = {
    disponivel: 'Disponível para adoção',
    tratamento: 'Em tratamento',
    'lar-temporario': 'Em lar temporário',
    adotado: 'Adotado'
  };

  const adoptionLabel =
    adoptionLabels[pet.status] ||
    'Situação não informada';


  const photo =
    typeof pet.photo === 'string'
      ? pet.photo.trim()
      : '';

  const validPhoto =
    photo.startsWith('data:image/') ||
    photo.startsWith('https://');

  const photoHtml =
    validPhoto
      ? `
        <img
          src="${escapeHtml(photo)}"
          alt="Foto de ${escapeHtml(
            pet.name || 'animal'
          )}"
        >
      `
      : `
        <div
          class="my-publication-photo-placeholder"
        >
          🐾
        </div>
      `;


  let createdAt =
    'Data não informada';

  if (pet.createdAt) {
    const date =
      new Date(
        pet.createdAt
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      createdAt =
        date.toLocaleDateString(
          'pt-BR'
        );
    }
  }


  const reasonHtml =
    pet.imageModerationReason
      ? `
        <div
          class="my-publication-moderation-reason"
        >
          <strong>
            Observação da moderação
          </strong>

          ${escapeHtml(
            pet.imageModerationReason
          )}
        </div>
      `
      : '';

      /* =====================================================
   ACAO - MARCAR COMO ADOTADO
===================================================== */

const finishActionHtml = `
  <div class="my-publication-actions">

    <button
      class="my-publication-edit"
      type="button"
    >
      ✏️ Editar
    </button>

    ${
      pet.status !== 'adotado'
        ? `
          <button
            class="my-publication-finish"
            type="button"
          >
            🏡 Marcar como adotado
          </button>
        `
        : ''
    }

    <button
      class="my-publication-delete"
      type="button"
    >
      🗑 Excluir
    </button>

  </div>
`;

  const card =
    document.createElement(
      'article'
    );

  card.className =
    'my-publication-card';

  card.dataset.petId =
    String(pet.id);


  card.innerHTML = `
    <div class="my-publication-photo">

      ${photoHtml}

      <span
        class="my-publication-status
               my-publication-status-${escapeHtml(
                 imageStatus
               )}"
      >
        ${escapeHtml(
          moderationLabel
        )}
      </span>

    </div>

    <div class="my-publication-body">

      <span class="my-publication-type">
        🐾 Adoção
      </span>

      <h3>
        ${escapeHtml(
          pet.name ||
          'Animal'
        )}
      </h3>

      <div class="my-publication-info">

        <p>
          <strong>Espécie:</strong>
          ${escapeHtml(
            pet.species ||
            'Não informada'
          )}
        </p>

        <p>
          <strong>Raça:</strong>
          ${escapeHtml(
            pet.breed ||
            'Não informada'
          )}
        </p>

        <p>
          <strong>Localização:</strong>
          ${escapeHtml(
            pet.location ||
            'Não informada'
          )}
        </p>

        <p>
          <strong>Cadastrado em:</strong>
          ${escapeHtml(
            createdAt
          )}
        </p>

      </div>

      <div class="my-publication-public-status">
        ${escapeHtml(
          adoptionLabel
        )}
      </div>

      ${reasonHtml}

${finishActionHtml}

</div>
`;

/* =====================================================
   BOTAO - EDITAR ANIMAL
===================================================== */

const editButton =
  card.querySelector(
    '.my-publication-edit'
  );

if (editButton) {
  editButton.addEventListener(
    'click',
    () => {
      openPetEditModal(pet);
    }
  );
}

const finishButton =
  card.querySelector(
    '.my-publication-finish'
  );

if (finishButton) {
  finishButton.addEventListener(
    'click',
    async () => {
      finishButton.disabled = true;

      try {
        const result =
          await apiRequest(
            `/api/my-publications/pets/${encodeURIComponent(
              String(pet.id)
            )}/status`,
            {
              method: 'PATCH',
              body: JSON.stringify({})
            }
          );

        showToast(
          result.message ||
          'Animal marcado como adotado.'
        );

        await loadMyPublications();

      } catch (error) {
        showToast(
          error.message ||
          'Não foi possível atualizar a publicação.',
          'error'
        );

      } finally {
        finishButton.disabled = false;
      }
    }
  );
}

/* =====================================================
   BOTAO - EXCLUIR ANIMAL
===================================================== */

const deleteButton =
  card.querySelector(
    '.my-publication-delete'
  );

if (deleteButton) {
  deleteButton.addEventListener(
    'click',
    async () => {

      const confirmed =
        window.confirm(
          `Tem certeza de que deseja excluir a publicação de ${pet.name || 'este animal'}?`
        );

      if (!confirmed) {
        return;
      }

      deleteButton.disabled = true;

      try {
        const result =
          await apiRequest(
            `/api/my-publications/pets/${encodeURIComponent(
              String(pet.id)
            )}`,
            {
              method: 'DELETE',
              body: JSON.stringify({})
            }
          );

        showToast(
          result.message ||
          'Publicação excluída com sucesso.'
        );

        await loadMyPublications();

      } catch (error) {
        showToast(
          error.message ||
          'Não foi possível excluir a publicação.',
          'error'
        );

      } finally {
        deleteButton.disabled = false;
      }
    }
  );
}

  targetGrid.appendChild(
  card
);
}

/* =========================================================
   CARD - MINHA OCORRENCIA
========================================================= */

function renderMyReportPublication(
  report,
  targetGrid = myPublicationsReportsGrid
) {
  if (
    !myPublicationsReportsGrid ||
    !report
  ) {
    return;
  }

  const imageStatus =
    report.imageStatus ||
    'approved';

  const moderationLabels = {
    pending: 'Aguardando análise',
    review: 'Em revisão',
    approved: 'Publicada',
    blocked: 'Foto bloqueada'
  };

  const moderationLabel =
    moderationLabels[imageStatus] ||
    'Status não informado';


  const reportStatus =
    report.status === 'encontrado'
      ? 'encontrado'
      : 'perdido';

  const reportStatusLabel =
    reportStatus === 'encontrado'
      ? 'Animal encontrado'
      : 'Animal perdido';


  const photo =
    typeof report.photo === 'string'
      ? report.photo.trim()
      : '';

  const validPhoto =
    photo.startsWith('data:image/') ||
    photo.startsWith('https://');

  const photoHtml =
    validPhoto
      ? `
        <img
          src="${escapeHtml(photo)}"
          alt="Foto de ${escapeHtml(
            report.name || 'animal'
          )}"
        >
      `
      : `
        <div
          class="my-publication-photo-placeholder"
        >
          🔎
        </div>
      `;


  let createdAt =
    'Data não informada';

  if (report.createdAt) {
    const date =
      new Date(report.createdAt);

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      createdAt =
        date.toLocaleDateString(
          'pt-BR'
        );
    }
  }


  const reasonHtml =
    report.imageModerationReason
      ? `
        <div
          class="my-publication-moderation-reason"
        >
          <strong>
            Observação da moderação
          </strong>

          ${escapeHtml(
            report.imageModerationReason
          )}
        </div>
      `
      : '';

/* =====================================================
   ACAO - ENCERRAR OCORRENCIA
===================================================== */

const publicationStatus =
  report.publicationStatus ||
  'active';

const finishLabel =
  report.status === 'encontrado'
    ? '✓ Entregue ao responsável'
    : '✓ Reencontrado';

const finishActionHtml = `
  <div class="my-publication-actions">

    <button
      class="my-publication-edit"
      type="button"
    >
      ✏️ Editar
    </button>

    ${
      publicationStatus === 'active'
        ? `
          <button
            class="my-publication-finish"
            type="button"
          >
            ${finishLabel}
          </button>
        `
        : ''
    }

    <button
      class="my-publication-delete"
      type="button"
    >
      🗑 Excluir
    </button>

  </div>
`;

  const card =
    document.createElement(
      'article'
    );

  card.className =
    'my-publication-card';

  card.dataset.reportId =
    String(report.id);


  card.innerHTML = `
    <div class="my-publication-photo">

      ${photoHtml}

      <span
        class="my-publication-status
               my-publication-status-${escapeHtml(
                 imageStatus
               )}"
      >
        ${escapeHtml(
          moderationLabel
        )}
      </span>

    </div>


    <div class="my-publication-body">

      <span class="my-publication-type">
        🔎 Achados e perdidos
      </span>


      <h3>
        ${escapeHtml(
          report.name ||
          'Animal'
        )}
      </h3>


      <div class="my-publication-info">

        <p>
          <strong>Espécie:</strong>
          ${escapeHtml(
            report.animal ||
            'Não informada'
          )}
        </p>

        <p>
          <strong>Raça:</strong>
          ${escapeHtml(
            report.breed ||
            'Não informada'
          )}
        </p>

        <p>
          <strong>Localização:</strong>
          ${escapeHtml(
            report.location ||
            'Não informada'
          )}
        </p>

        <p>
          <strong>Publicado em:</strong>
          ${escapeHtml(
            createdAt
          )}
        </p>

      </div>


      <div class="my-publication-public-status">
  ${escapeHtml(
    reportStatusLabel
  )}
  ·
  ${publicationStatus === 'resolved'
    ? 'Resolvida'
    : 'Ativa'}
</div>


      ${reasonHtml}

      ${finishActionHtml}

    </div>
    `;


/* =====================================================
   BOTAO - EDITAR OCORRENCIA
===================================================== */

const editButton =
  card.querySelector(
    '.my-publication-edit'
  );

if (editButton) {
  editButton.addEventListener(
    'click',
    () => {
      openReportEditModal(
        report
      );
    }
  );
}


/* =====================================================
   BOTAO - ENCERRAR OCORRENCIA
===================================================== */

const finishButton =
  card.querySelector(
    '.my-publication-finish'
  );

if (finishButton) {
  finishButton.addEventListener(
    'click',
    async () => {
      finishButton.disabled = true;

      try {
        const result =
          await apiRequest(
            `/api/my-publications/reports/${encodeURIComponent(
              String(report.id)
            )}/status`,
            {
              method: 'PATCH',
              body: JSON.stringify({})
            }
          );

        showToast(
          result.message ||
          'Ocorrência encerrada com sucesso.'
        );

        await loadMyPublications();

      } catch (error) {
        showToast(
          error.message ||
          'Não foi possível encerrar a ocorrência.',
          'error'
        );

      } finally {
        finishButton.disabled = false;
      }
    }
  );
}


/* =====================================================
   BOTAO - EXCLUIR OCORRENCIA
===================================================== */

const deleteButton =
  card.querySelector(
    '.my-publication-delete'
  );

if (deleteButton) {
  deleteButton.addEventListener(
    'click',
    async () => {
      const confirmed =
        window.confirm(
          `Tem certeza de que deseja excluir a ocorrência de ${report.name || 'este animal'}?`
        );

      if (!confirmed) {
        return;
      }

      deleteButton.disabled = true;

      try {
        const result =
          await apiRequest(
            `/api/my-publications/reports/${encodeURIComponent(
              String(report.id)
            )}`,
            {
              method: 'DELETE',
              body: JSON.stringify({})
            }
          );

        showToast(
          result.message ||
          'Ocorrência excluída com sucesso.'
        );

        await loadMyPublications();

      } catch (error) {
        showToast(
          error.message ||
          'Não foi possível excluir a ocorrência.',
          'error'
        );

      } finally {
        deleteButton.disabled = false;
      }
    }
  );
}


/* =====================================================
   ADICIONAR CARD
===================================================== */

targetGrid.appendChild(
  card
);
}

/* =========================================================
   WIKIPET - MODAL DE PUBLICACAO
========================================================= */

const wikiCreateButton =
  document.querySelector(
    '#wiki-create-button'
  );

const wikiCreateModal =
  document.querySelector(
    '#wiki-create-modal'
  );

const wikiCreateClose =
  document.querySelector(
    '.wiki-create-close'
  );

const wikiCreateForm =
  document.querySelector(
    '#wiki-create-form'
  );


function openWikiCreateModal() {
  if (!wikiCreateModal) {
    return;
  }

  wikiCreateModal.classList.add(
    'open'
  );

  wikiCreateModal.setAttribute(
    'aria-hidden',
    'false'
  );
}


function closeWikiCreateModal() {
  if (!wikiCreateModal) {
    return;
  }

  wikiCreateModal.classList.remove(
    'open'
  );

  wikiCreateModal.setAttribute(
    'aria-hidden',
    'true'
  );

  editingWikiArticleId = null;
}


if (wikiCreateButton) {
  wikiCreateButton.addEventListener(
    'click',
    () => {
      editingWikiArticleId = null;

      if (wikiCreateForm) {
        wikiCreateForm.reset();
      }

      const title =
        wikiCreateModal?.querySelector(
          '#wiki-create-title'
        );

      if (title) {
        title.textContent =
          'Publicar na WikiPet';
      }

      const submitButton =
        wikiCreateForm?.querySelector(
          'button[type="submit"]'
        );

      if (submitButton) {
        submitButton.textContent =
          '✍️ Publicar artigo';
      }

      openWikiCreateModal();
    }
  );
}


if (wikiCreateClose) {
  wikiCreateClose.addEventListener(
    'click',
    closeWikiCreateModal
  );
}


if (wikiCreateModal) {
  wikiCreateModal.addEventListener(
    'click',
    (event) => {
      if (
        event.target ===
        wikiCreateModal
      ) {
        closeWikiCreateModal();
      }
    }
  );
}

/* =========================================================
   WIKIPET - EDITAR ARTIGO
========================================================= */

let editingWikiArticleId = null;

function openWikiEditModal(article) {
  if (
    !wikiCreateModal ||
    !wikiCreateForm ||
    !article
  ) {
    return;
  }

  editingWikiArticleId =
    Number(article.id);

  const values = {
    title:
      article.title || '',

    category:
      article.category || '',

    summary:
      article.summary || '',

    content:
      article.content || ''
  };

  Object.entries(values)
    .forEach(
      ([name, value]) => {
        const field =
          wikiCreateForm.elements[name];

        if (field) {
          field.value = value;
        }
      }
    );

  const title =
    wikiCreateModal.querySelector(
      '#wiki-create-title'
    );

  if (title) {
    title.textContent =
      'Editar artigo da WikiPet';
  }

  const submitButton =
    wikiCreateForm.querySelector(
      'button[type="submit"]'
    );

  if (submitButton) {
    submitButton.textContent =
      '💾 Salvar alterações';
  }

  openWikiCreateModal();
}

/* =========================================================
   WIKIPET - PUBLICAR ARTIGO
========================================================= */

if (wikiCreateForm) {
  wikiCreateForm.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      const formData =
        new FormData(
          wikiCreateForm
        );

      const article = {
        title:
          String(
            formData.get('title') || ''
          ).trim(),

        category:
          String(
            formData.get('category') || ''
          ).trim(),

        summary:
          String(
            formData.get('summary') || ''
          ).trim(),

        content:
          String(
            formData.get('content') || ''
          ).trim()
      };

      if (
        !article.title ||
        !article.category ||
        !article.summary ||
        !article.content
      ) {
        showToast(
          'Preencha título, categoria, resumo e conteúdo.',
          'error'
        );

        return;
      }

      const submitButton =
        wikiCreateForm.querySelector(
          'button[type="submit"]'
        );

      const originalButtonText =
        submitButton?.textContent;

      if (submitButton) {
        submitButton.disabled = true;

        submitButton.textContent =
          'Publicando...';
      }

      try {
        const parsedEditingWikiId =
  Number(editingWikiArticleId);

const isEditing =
  editingWikiArticleId !== null &&
  editingWikiArticleId !== '' &&
  Number.isSafeInteger(
    parsedEditingWikiId
  ) &&
  parsedEditingWikiId > 0;

const endpoint =
  isEditing
    ? `/api/wiki/${encodeURIComponent(
        String(parsedEditingWikiId)
      )}`
    : '/api/wiki';

const method =
  isEditing
    ? 'PATCH'
    : 'POST';

const result =
  await apiRequest(
    endpoint,
    {
      method,

      body:
        JSON.stringify(
          article
        )
    }
  );

        if (!result.article) {
          throw new Error(
            'O servidor não retornou o artigo publicado.'
          );
        }

        if (isEditing) {
  await loadWikiArticles();
  await loadMyPublications();

  showToast(
    result.message ||
    'Artigo atualizado com sucesso.'
  );

} else {
  renderWikiArticle(
    result.article
  );

  filterWikiArticles();

  showToast(
    result.message ||
    'Artigo publicado na WikiPet com sucesso!'
  );
}

        wikiCreateForm.reset();

        editingWikiArticleId = null;

        closeWikiCreateModal();

        showToast(
          result.message ||
          'Artigo publicado na WikiPet com sucesso!'
        );

      } catch (error) {
        console.error(
          'Erro ao publicar na WikiPet:',
          error
        );

        showToast(
          error.message ||
          'Não foi possível publicar o artigo.',
          'error'
        );

      } finally {
        if (submitButton) {
          submitButton.disabled = false;

          submitButton.textContent =
            originalButtonText ||
            '✍️ Publicar artigo';
        }
      }
    }
  );
}

/* =========================================================
   WIKIPET - ELEMENTOS DA LISTAGEM
========================================================= */

const wikiGrid =
  document.querySelector(
    '#wiki-grid'
  );

const wikiSearch =
  document.querySelector(
    '#wiki-search'
  );

const wikiEmpty =
  document.querySelector(
    '#wiki-empty'
  );

const wikiFilters =
  [
    ...document.querySelectorAll(
      '.wiki-filter'
    )
  ];


/* =========================================================
   WIKIPET - CRIAR CARD DA COMUNIDADE
========================================================= */

function renderWikiArticle(article) {
  if (
    !wikiGrid ||
    !article
  ) {
    return;
  }

  const categoryLabels = {
    saude: 'Saúde',
    cuidados: 'Cuidados',
    adocao: 'Adoção'
  };

  const categoryClasses = {
    saude: 'category-health',
    cuidados: 'category-care',
    adocao: 'category-adoption'
  };

  const category =
    article.category ||
    'cuidados';

  const categoryLabel =
    categoryLabels[category] ||
    'Cuidados';

  const categoryClass =
    categoryClasses[category] ||
    'category-care';

  const card =
    document.createElement(
      'article'
    );

  card.className =
    'wiki-card wiki-community-card';

  card.dataset.category =
    category;

  card.dataset.search =
    [
      article.title || '',
      article.summary || '',
      article.content || '',
      article.authorName || '',
      categoryLabel
    ]
      .join(' ')
      .toLowerCase();

  card.dataset.articleId =
    String(
      article.id || ''
    );

  card.innerHTML = `
    <span
      class="wiki-category ${categoryClass}"
    >
      ${escapeHtml(
        categoryLabel
      )}
    </span>

    <h3>
      ${escapeHtml(
        article.title ||
        'Artigo'
      )}
    </h3>

    <p>
      ${escapeHtml(
        article.summary ||
        ''
      )}
    </p>

    <div class="wiki-meta">
      <span>
        Por ${escapeHtml(
          article.authorName ||
          'Comunidade NeoPetCare'
        )}
      </span>
    </div>
  `;

  wikiGrid.appendChild(
    card
  );
}


/* =========================================================
   WIKIPET - FILTRAR ARTIGOS
========================================================= */

function filterWikiArticles() {
  if (!wikiGrid) {
    return;
  }

  const search =
    wikiSearch
      ? wikiSearch.value
          .toLowerCase()
          .trim()
      : '';

  const activeFilter =
    document.querySelector(
      '.wiki-filter.active'
    );

  const selectedCategory =
    activeFilter?.dataset.category ||
    'todos';

  let visibleCount = 0;

  wikiGrid
    .querySelectorAll(
      '.wiki-card'
    )
    .forEach((card) => {
      const category =
        card.dataset.category ||
        '';

      const searchableText =
        (
          card.dataset.search ||
          card.textContent ||
          ''
        )
          .toLowerCase();

      const categoryMatches =
        selectedCategory ===
          'todos' ||
        selectedCategory ===
          category;

      const searchMatches =
        searchableText.includes(
          search
        );

      const visible =
        categoryMatches &&
        searchMatches;

      card.hidden =
        !visible;

      if (visible) {
        visibleCount += 1;
      }
    });

  if (wikiEmpty) {
    wikiEmpty.hidden =
      visibleCount > 0;
  }
}


/* =========================================================
   WIKIPET - CARREGAR DO POSTGRESQL
========================================================= */

async function loadWikiArticles() {
  if (!wikiGrid) {
    return;
  }

  try {
    const result =
      await apiRequest(
        '/api/wiki'
      );

    const articles =
      Array.isArray(
        result.articles
      )
        ? result.articles
        : [];

    /*
     * Remove apenas os cards dinâmicos.
     * Os três artigos oficiais do HTML
     * permanecem intactos.
     */
    wikiGrid
      .querySelectorAll(
        '.wiki-community-card'
      )
      .forEach(
        (card) => {
          card.remove();
        }
      );

    articles.forEach(
      (article) => {
        renderWikiArticle(
          article
        );
      }
    );

    filterWikiArticles();

  } catch (error) {
    console.error(
      'Erro ao carregar a WikiPet:',
      error
    );
  }
}


/* =========================================================
   WIKIPET - BUSCA
========================================================= */

if (wikiSearch) {
  wikiSearch.addEventListener(
    'input',
    filterWikiArticles
  );
}


/* =========================================================
   WIKIPET - FILTROS
========================================================= */

wikiFilters.forEach(
  (button) => {
    button.addEventListener(
      'click',
      () => {
        wikiFilters.forEach(
          (item) => {
            item.classList.remove(
              'active'
            );
          }
        );

        button.classList.add(
          'active'
        );

        filterWikiArticles();
      }
    );
  }
);


/* =========================================================
   WIKIPET - INICIALIZAR
========================================================= */

loadWikiArticles();

/* =========================================================
   INICIALIZAÇÃO FINAL
========================================================= */

async function initializeNeoPetCare() {

  console.log(
    'NeoPetCare frontend carregado.'
  );

  console.log(
    `API configurada: ${
      API_BASE ||
      'mesmo domínio'
    }`
  );

  const apiAvailable =
    await checkApiHealth();

  if (!apiAvailable) {

    showToast(
      'Aviso: não foi possível conectar ao servidor.'
    );
  }
}

initializeNeoPetCare();