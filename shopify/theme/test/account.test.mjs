import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { addressToggleLabel, provinceSelectorArgs } from '../src/js/account.mjs';

const theme = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFile(path.join(theme, ...p), 'utf8');

test('addressToggleLabel mirrors the React Address Book button', () => {
  assert.equal(addressToggleLabel(false), '+ Add Address');
  assert.equal(addressToggleLabel(true), 'Cancel');
});

test('provinceSelectorArgs derives the element ids Shopify.CountryProvinceSelector needs', () => {
  assert.deepEqual(provinceSelectorArgs('New'), {
    country: 'AddressCountryNew',
    province: 'AddressProvinceNew',
    options: { hideElement: 'AddressProvinceContainerNew' },
  });
});

test('every classic customer template exists and points at its section', async () => {
  const expected = {
    login: 'main-login',
    register: 'main-register',
    reset_password: 'main-reset',
    activate_account: 'main-activate',
    account: 'main-account',
    order: 'main-order',
    addresses: 'main-addresses',
  };
  for (const [name, section] of Object.entries(expected)) {
    const json = JSON.parse(await read('templates', 'customers', `${name}.json`));
    assert.equal(json.sections.main.type, section, `${name}.json`);
    await read('sections', `${section}.liquid`);
  }
});

test('customer sections use the Shopify form each page needs', async () => {
  const forms = {
    'main-login.liquid': ["form 'customer_login'", "form 'recover_customer_password'", 'customer[email]', 'customer[password]'],
    'main-register.liquid': ["form 'create_customer'", 'customer[first_name]', 'customer[email]', 'customer[password]'],
    'main-reset.liquid': ["form 'reset_customer_password'", 'customer[password]', 'customer[password_confirmation]'],
    'main-activate.liquid': ["form 'activate_customer_password'", 'customer[password]', 'customer[password_confirmation]'],
    'main-addresses.liquid': ["form 'customer_address'", 'address[address1]', 'address[city]', 'address[zip]', 'address[country]'],
  };
  for (const [file, needles] of Object.entries(forms)) {
    const src = await read('sections', file);
    for (const needle of needles) assert.ok(src.includes(needle), `${file} is missing ${needle}`);
  }
});

test('the account nav links to the localStorage wishlist page and signs out through Shopify', async () => {
  const src = await read('snippets', 'account-nav.liquid');
  assert.match(src, /routes\.account_logout_url/);
  assert.match(src, /routes\.account_addresses_url/);
  assert.match(src, /wishlist/);
});
