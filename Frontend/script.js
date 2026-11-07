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
   DETALHES DOS PETS
========================================================= */

const lunaDetailsModal =
  document.querySelector(
    '#luna-details-modal'
  );

const lunaDetailsButton =
  document.querySelector(
    '[data-pet-details="Luna"]'
  );

const lunaDetailsClose =
  lunaDetailsModal?.querySelector(
    '.pet-details-close'
  );

function openLunaDetails() {
  if (!lunaDetailsModal) {
    return;
  }

  lunaDetailsModal.classList.add(
    'open'
  );

  lunaDetailsModal.setAttribute(
    'aria-hidden',
    'false'
  );
}

function closeLunaDetails() {
  if (!lunaDetailsModal) {
    return;
  }

  lunaDetailsModal.classList.remove(
    'open'
  );

  lunaDetailsModal.setAttribute(
    'aria-hidden',
    'true'
  );
}

if (lunaDetailsButton) {
  lunaDetailsButton.addEventListener(
    'click',
    openLunaDetails
  );
}

if (lunaDetailsClose) {
  lunaDetailsClose.addEventListener(
    'click',
    closeLunaDetails
  );
}

if (lunaDetailsModal) {
  lunaDetailsModal.addEventListener(
    'click',
    (event) => {
      if (
        event.target ===
        lunaDetailsModal
      ) {
        closeLunaDetails();
      }
    }
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

  const card =
    document.createElement(
      'article'
    );

  card.className =
    'report-card';

  card.dataset.status =
    status;

  card.dataset.search =
    [
      report.name || '',
      report.animal || '',
      report.location || '',
      report.description || ''
    ]
      .join(' ')
      .toLowerCase();

  const photo =
    typeof report.photo ===
      'string'
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
      : '';

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

      <p>
        ${escapeHtml(
          report.location ||
          'Local não informado'
        )}
      </p>

      <span class="report-date">

        ${escapeHtml(
          formatReportDate(
            report.date
          )
        )}

      </span>

      <p class="report-description">

        ${escapeHtml(
          report.description ||
          ''
        )}

      </p>

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

      const report = {

        status:
          selectedReportStatus,

        name:
          formData.get(
            'name'
          ),

        animal:
          formData.get(
            'animal'
          ),

        date:
          formData.get(
            'date'
          ),

        location:
          formData.get(
            'location'
          ),

        contact:
          formData.get(
            'contact'
          ) || '',

        description:
          formData.get(
            'description'
          ),

        photo: ''
      };

      if (
        !report.name ||
        !report.animal ||
        !report.location ||
        !report.description
      ) {

        showToast(
          'Preencha os campos obrigatórios da ocorrência.'
        );

        return;
      }

      const submitButton =
        reportForm.querySelector(
          'button[type="submit"]'
        );

      if (submitButton) {
        submitButton.disabled = true;
      }

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

        if (result.report) {

          renderReport(
            result.report
          );
        }

        reportForm.reset();

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

        closeReportModal();

        filterReports();

        showToast(
          'Ocorrência publicada com sucesso!'
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
    closeLunaDetails();
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