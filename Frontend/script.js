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
  return String(value).replace(
    /[&<>'"]/g,
    (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
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
    openPetRegisterModal
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
          'Cadastrando animal...';
      }

      try {
        const result =
          await apiRequest(
            '/api/pets',
            {
              method: 'POST',

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

        petRegisterForm.reset();

        clearPetRegisterPhoto();

        closePetRegisterModal();

        showToast(
          `${result.pet.name} foi cadastrado com sucesso!`
        );

      } catch (error) {
        console.error(
          'Erro ao cadastrar animal:',
          error
        );

        showToast(
          error.message ||
          'Não foi possível cadastrar o animal.',
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
    closePetDetails
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
          'Publicando...';
      }


      /* =====================================================
         ENVIAR PARA O POSTGRESQL
      ===================================================== */

      try {

        const result =
          await apiRequest(
            '/api/reports',
            {
              method: 'POST',

              body:
                JSON.stringify(
                  report
                )
            }
          );


        /* ===================================================
           MOSTRAR NOVA OCORRÊNCIA
        =================================================== */

        if (result.report) {

          renderReport(
            result.report
          );

        }


        /* ===================================================
           LIMPAR FORMULÁRIO
        =================================================== */

        reportForm.reset();

        clearReportPhoto();


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

        showToast(
          'Ocorrência publicada com sucesso!'
        );


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
   INICIALIZAÇÃO DAS INFORMAÇÕES DA API
========================================================= */
const savedUser = getSavedUser();

if (savedUser) {
  showLoggedUser(savedUser);
}

loadReports();
loadPartners();
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