'use strict';

const CART_KEY = 'luxury-shop-cart';
const MAX_QTY = 99;

const catalogEl = document.getElementById('catalog');
const stipendRateEl = document.getElementById('stipend-rate');

const productDialog = document.getElementById('product-dialog');
const productBodyEl = document.getElementById('product-body');

const cartDialog = document.getElementById('cart-dialog');
const cartOpenBtn = document.getElementById('cart-open');
const cartCountEl = document.getElementById('cart-count');
const cartListEl = document.getElementById('cart-list');
const cartEmptyEl = document.getElementById('cart-empty');
const cartTotalEl = document.getElementById('cart-total');
const cartStipendsEl = document.getElementById('cart-stipends');
const checkoutBtn = document.getElementById('checkout-btn');

const orderDialog = document.getElementById('order-dialog');
const orderForm = document.getElementById('order-form');
const orderSuccessEl = document.getElementById('order-success');


function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createButton(className, text, action, id) {
  const button = createElement('button', className, text);
  button.type = 'button';
  if (action) button.dataset.action = action;
  if (id !== undefined) button.dataset.id = id;
  return button;
}

function findProduct(id) {
  return products.find((product) => product.id === id);
}

function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

function pluralize(number, forms) {
  const mod10 = number % 10;
  const mod100 = number % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

function formatStipends(price) {
  const count = Math.ceil(price / STIPEND);
  const word = pluralize(count, ['стипендия', 'стипендии', 'стипендий']);
  return `≈ ${count.toLocaleString('ru-RU')} ${word}`;
}


function createProductCard(product) {
  const card = createElement('article', 'card');

  const image = createElement('img', 'card__image');
  image.src = product.image;
  image.alt = product.title;
  image.loading = 'lazy';

  const body = createElement('div', 'card__body');
  const title = createElement('h3', 'card__title', product.title);
  const price = createElement('p', 'card__price', formatPrice(product.price));
  const stipends = createElement('p', 'card__stipends', formatStipends(product.price));

  const actions = createElement('div', 'card__actions');
  actions.append(
    createButton('button button--ghost', 'Подробнее', 'details', product.id),
    createButton('button', 'В корзину', 'add', product.id),
  );

  body.append(title, price, stipends, actions);
  card.append(image, body);
  return card;
}

function renderCatalog() {
  catalogEl.replaceChildren(...products.map(createProductCard));
}


function openProductDetails(id) {
  const product = findProduct(id);

  const image = createElement('img', 'product-details__image');
  image.src = product.image;
  image.alt = product.title;

  const info = createElement('div');
  info.append(
    createElement('h2', 'dialog__title', product.title),
    createElement('p', 'product-details__text', product.description),
    createElement('p', 'product-details__price', formatPrice(product.price)),
    createElement('p', 'product-details__stipends', formatStipends(product.price)),
    createButton('button button--wide', 'В корзину', 'add', product.id),
  );

  productBodyEl.replaceChildren(image, info);
  productDialog.showModal();
}

function showAddedFeedback(button) {
  button.textContent = 'Добавлено';
  button.disabled = true;
  setTimeout(() => {
    button.textContent = 'В корзину';
    button.disabled = false;
  }, 900);
}

function handleProductAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const id = Number(button.dataset.id);
  if (button.dataset.action === 'add') {
    addToCart(id);
    showAddedFeedback(button);
  } else if (button.dataset.action === 'details') {
    openProductDetails(id);
  }
}

catalogEl.addEventListener('click', handleProductAction);
productBodyEl.addEventListener('click', handleProductAction);



document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog').close());
});


document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});



let cart = loadCart();

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY)) ?? [];
    return saved.filter((item) => findProduct(item.id) && item.qty > 0);
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCart() {
  saveCart();
  renderCart();
}

function addToCart(id) {
  const item = cart.find((cartItem) => cartItem.id === id);
  if (item) {
    item.qty = Math.min(item.qty + 1, MAX_QTY);
  } else {
    cart.push({ id, qty: 1 });
  }
  updateCart();
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  updateCart();
}

function changeQty(id, qty) {
  if (Number.isNaN(qty)) {
    renderCart();
    return;
  }
  if (qty < 1) {
    removeFromCart(id);
    return;
  }
  cart.find((item) => item.id === id).qty = Math.min(Math.floor(qty), MAX_QTY);
  updateCart();
}

function getTotal() {
  return cart.reduce((sum, item) => sum + findProduct(item.id).price * item.qty, 0);
}

function getCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}


function createCartItem(item) {
  const product = findProduct(item.id);

  const li = createElement('li', 'cart-item');
  li.dataset.id = item.id;

  const image = createElement('img', 'cart-item__image');
  image.src = product.image;
  image.alt = '';

  const info = createElement('div', 'cart-item__info');
  info.append(
    createElement('p', 'cart-item__title', product.title),
    createElement('p', 'cart-item__unit', `${formatPrice(product.price)} за шт.`),
  );

  const qty = createElement('div', 'qty');
  const minus = createButton('qty__button', '−', 'decrease');
  minus.setAttribute('aria-label', 'Уменьшить количество');
  const input = createElement('input', 'qty__input');
  input.type = 'number';
  input.min = 1;
  input.max = MAX_QTY;
  input.value = item.qty;
  input.setAttribute('aria-label', `Количество: ${product.title}`);
  const plus = createButton('qty__button', '+', 'increase');
  plus.setAttribute('aria-label', 'Увеличить количество');
  qty.append(minus, input, plus);

  const sum = createElement('p', 'cart-item__sum', formatPrice(product.price * item.qty));

  const remove = createButton('cart-item__remove', '×', 'remove');
  remove.setAttribute('aria-label', `Удалить «${product.title}» из корзины`);

  li.append(image, info, remove, qty, sum);
  return li;
}

function renderCart() {
  cartListEl.replaceChildren(...cart.map(createCartItem));

  const total = getTotal();
  cartTotalEl.textContent = formatPrice(total);
  cartStipendsEl.textContent = total > 0 ? formatStipends(total) : '';

  const count = getCount();
  cartCountEl.textContent = count;
  cartCountEl.hidden = count === 0;

  cartEmptyEl.hidden = cart.length > 0;
  checkoutBtn.disabled = cart.length === 0;
}

function handleCartClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const id = Number(button.closest('.cart-item').dataset.id);
  const item = cart.find((cartItem) => cartItem.id === id);

  if (button.dataset.action === 'remove') removeFromCart(id);
  if (button.dataset.action === 'decrease') changeQty(id, item.qty - 1);
  if (button.dataset.action === 'increase') changeQty(id, item.qty + 1);
}

function handleQtyInput(event) {
  if (!event.target.classList.contains('qty__input')) return;
  const id = Number(event.target.closest('.cart-item').dataset.id);
  changeQty(id, Number.parseInt(event.target.value, 10));
}

cartOpenBtn.addEventListener('click', () => cartDialog.showModal());
cartListEl.addEventListener('click', handleCartClick);
cartListEl.addEventListener('change', handleQtyInput);



const NAME_PATTERN = /^[A-Za-zА-Яа-яЁё\- ]{2,}$/;

const validators = {
  firstName: (value) => NAME_PATTERN.test(value) || 'Введите имя буквами, минимум 2 символа',
  lastName: (value) => NAME_PATTERN.test(value) || 'Введите фамилию буквами, минимум 2 символа',
  address: (value) => value.length >= 10 || 'Укажите город, улицу и дом',
  phone: (value) => {
    const digits = value.replace(/\D/g, '');
    const isValid = /^\+?[\d\s()-]+$/.test(value) && digits.length >= 10 && digits.length <= 12;
    return isValid || 'Введите номер, например +7 900 123-45-67';
  },
};

function validateField(input) {
  const result = validators[input.name](input.value.trim());
  const message = result === true ? '' : result;
  document.getElementById(`${input.name}-error`).textContent = message;
  input.setAttribute('aria-invalid', String(Boolean(message)));
  return !message;
}

function getFormInputs() {
  return [...orderForm.elements].filter((element) => element.name in validators);
}

function resetOrderForm() {
  orderForm.reset();
  getFormInputs().forEach((input) => {
    input.removeAttribute('aria-invalid');
    document.getElementById(`${input.name}-error`).textContent = '';
  });
  orderForm.hidden = false;
  orderSuccessEl.hidden = true;
}

function handleOrderSubmit(event) {
  event.preventDefault();

  const inputs = getFormInputs();
  const invalidInput = inputs.filter((input) => !validateField(input))[0];
  if (invalidInput) {
    invalidInput.focus();
    return;
  }

  orderForm.hidden = true;
  orderSuccessEl.hidden = false;
  cart = [];
  updateCart();
}

checkoutBtn.addEventListener('click', () => {
  cartDialog.close();
  orderDialog.showModal();
});

orderForm.addEventListener('submit', handleOrderSubmit);
orderForm.addEventListener('focusout', (event) => {
  if (event.target.name in validators && event.target.value.trim()) {
    validateField(event.target);
  }
});
orderForm.addEventListener('input', (event) => {
  if (event.target.getAttribute('aria-invalid') === 'true') {
    validateField(event.target);
  }
});
orderDialog.addEventListener('close', resetOrderForm);


stipendRateEl.textContent = formatPrice(STIPEND);
renderCatalog();
renderCart();