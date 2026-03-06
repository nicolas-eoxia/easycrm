/* Copyright (C) 2025 EVARISK <technique@evarisk.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

"use strict";

/**
 * \file    js/modules/eventpro.js
 * \ingroup reedcrm
 * \brief   JavaScript eventpro modal file for module ReedCRM
 */

if (!window.reedcrm) {
  window.reedcrm = {};
}

/**
 * Init eventpro JS
 *
 * @memberof ReedCRM_EventPro
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @type {Object}
 */
window.reedcrm.eventpro = {};

/**
 * Eventpro modal ID
 *
 * @memberof ReedCRM_EventPro
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @type {String}
 */
window.reedcrm.eventpro.modalId = 'eventproCardModal';

/**
 * Track if refresh was already triggered to avoid double refresh
 *
 * @memberof ReedCRM_EventPro
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @type {Boolean}
 */
window.reedcrm.eventpro.refreshTriggered = false;

/**
 * Eventpro init
 *
 * @memberof ReedCRM_EventPro
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @returns {void}
 */
window.reedcrm.eventpro.init = function () {
  window.reedcrm.eventpro.event();
  window.reedcrm.eventpro.modalCloseWatcher();
  window.reedcrm.eventpro.initAddContact();
};

/**
 * Load content into modal via AJAX
 *
 * @memberof ReedCRM_EventPro
 *
 * @since   1.1.0
 * @version 1.1.0
 *
 * @param {String} url The URL to load
 * @returns {void}
 */
window.reedcrm.eventpro.loadModalContent = function (url) {
  var $content = $('#' + window.reedcrm.eventpro.modalId + '-content');
  var $loader = $('#' + window.reedcrm.eventpro.modalId + '-loader');

  $loader.show().addClass('wpeo-loader');
  if (typeof window.saturne !== 'undefined' && window.saturne.loader) {
    window.saturne.loader.display($loader);
  }
  $content.hide().empty();

  var separator = url.indexOf('?') !== -1 ? '&' : '?';
  var ajaxUrl = url + separator + 'modal=1';

  $.ajax({
    url: ajaxUrl,
    type: 'GET',
    success: function (html) {
      $content.html(html);
      $content.show();

      if (typeof window.saturne !== 'undefined' && window.saturne.loader) {
        window.saturne.loader.remove($loader);
      } else {
        $loader.hide();
      }

      window.reedcrm.eventpro.bindModalContentEvents();
    },
    error: function () {
      if (typeof window.saturne !== 'undefined' && window.saturne.loader) {
        window.saturne.loader.remove($loader);
      } else {
        $loader.hide();
      }
      $content.html('<div class="error" style="padding: 20px;">Erreur lors du chargement</div>');
      $content.show();
    }
  });
};

/**
 * Bind events on AJAX-loaded modal content (form submit, tab clicks)
 *
 * @memberof ReedCRM_EventPro
 *
 * @since   1.1.0
 * @version 1.1.0
 *
 * @returns {void}
 */
window.reedcrm.eventpro.bindModalContentEvents = function () {
  var $content = $('#' + window.reedcrm.eventpro.modalId + '-content');

  $content.find('form').off('submit.reedcrm').on('submit.reedcrm', function (e) {
    e.preventDefault();
    var $form = $(this);
    var formAction = $form.attr('action');
    var separator = formAction.indexOf('?') !== -1 ? '&' : '?';

    $.ajax({
      url: formAction + separator + 'modal=1',
      type: 'POST',
      data: $form.serialize(),
      dataType: 'json',
      success: function (response) {
        if (response && response.success) {
          var projectId = $('#' + window.reedcrm.eventpro.modalId).attr('data-project-id');
          $('#' + window.reedcrm.eventpro.modalId).removeClass('modal-active');
          $('#' + window.reedcrm.eventpro.modalId + '-content').empty();
          window.reedcrm.eventpro.refreshProjectRow(projectId);

          if (response.message && typeof window.saturne !== 'undefined' && window.saturne.notification) {
            window.saturne.notification.success(response.message);
          }
        } else {
          var errorMsg = (response && response.error) ? response.error : 'Erreur';
          if (typeof window.saturne !== 'undefined' && window.saturne.notification) {
            window.saturne.notification.error(errorMsg);
          } else {
            alert(errorMsg);
          }
        }
      },
      error: function () {
        if (typeof window.saturne !== 'undefined' && window.saturne.notification) {
          window.saturne.notification.error('Erreur lors de la soumission');
        } else {
          alert('Erreur lors de la soumission');
        }
      }
    });
  });

  $content.find('a[href*="tab="]').on('click', function (e) {
    e.preventDefault();
    var url = $(this).attr('href');
    window.reedcrm.eventpro.loadModalContent(url);
  });
};

/**
 * Refresh the project row
 *
 * @memberof ReedCRM_EventPro
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @param {String|Number} projectId The project ID
 * @returns {void}
 */
window.reedcrm.eventpro.refreshProjectRow = function (projectId) {
  if (!projectId) {
    window.location.reload();
    return;
  }

  var baseUrl = window.location.href.split('&action=')[0].split('#')[0];
  var curTr   = $('tr[data-rowid="' + projectId + '"]');
  var curCell = curTr.find('td[data-field="relauch_commercial2"]');

  if (!curTr.length) {
    window.location.reload();
    return;
  }

  window.saturne.loader.display(curCell);

  $.ajax({
    url: baseUrl,
    type: 'GET',
    success: function (resp) {
      curCell.replaceWith($(resp).find('tr[data-rowid="' + projectId + '"] td[data-field="relauch_commercial2"]'));
    },
    error: function () {
      curTr.css('opacity', '1');
    }
  });
};

/**
 * Handle modal close watcher - don't refresh on close, only on form submission
 *
 * @memberof ReedCRM_EventPro
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @returns {void}
 */
window.reedcrm.eventpro.modalCloseWatcher = function () {
  var previousModalState = false;
  setInterval(function () {
    var isModalActive = $('#' + window.reedcrm.eventpro.modalId).hasClass('modal-active');
    if (previousModalState && !isModalActive) {
      window.reedcrm.eventpro.refreshTriggered = false;
    }
    previousModalState = isModalActive;
  }, 200);
};

/**
 * Eventpro events
 *
 * @memberof ReedCRM_EventPro
 *
 * @since   1.0.0
 * @version 1.1.0
 *
 * @returns {void}
 */
window.reedcrm.eventpro.event = function () {
  var modalSelector = '#' + window.reedcrm.eventpro.modalId;

  $(document).on('click', modalSelector + ' .modal-close, ' + modalSelector + ' .modal-close i', function (e) {
    e.preventDefault();
    var $modal = $(modalSelector);
    $modal.removeClass('modal-active');
    $modal.find('#' + window.reedcrm.eventpro.modalId + '-content').empty();
  });

  $(document).on('click', modalSelector, function (e) {
    if ($(e.target).is(modalSelector)) {
      $(this).removeClass('modal-active');
      $(this).find('#' + window.reedcrm.eventpro.modalId + '-content').empty();
    }
  });

  $(document).on('click', '.reedcrm-modal-open, .reedcrm-card-modal-open', function (e) {
    var $button = $(this);
    var modalUrl = $button.attr('data-modal-url');
    var projectId = $button.attr('data-project-id');

    if (modalUrl) {
      var $modal = $('#' + window.reedcrm.eventpro.modalId);

      $modal.addClass('modal-active');
      $modal.attr('data-project-id', projectId);

      window.reedcrm.eventpro.loadModalContent(modalUrl);
    }
  });
};

/**
 * Initialize add contact functionality
 *
 * @memberof ReedCRM_EventPro
 *
 * @since   1.0.0
 * @version 1.0.0
 */
window.reedcrm.eventpro.initAddContact = function () {
  $(document).on('click', '.reedcrm-add-contact-btn', function (e) {
    e.preventDefault();
    var $form = $(this).closest('.reedcrm-contact-field-wrapper').parent().find('.reedcrm-add-contact-form');
    $form.slideDown();
  });

  $(document).on('click', '.reedcrm-add-contact-cancel', function (e) {
    e.preventDefault();
    var $form = $(this).closest('.reedcrm-add-contact-form');
    $form.slideUp();
    $form.find('input').val('');
  });

  $(document).on('click', '.reedcrm-add-contact-submit', function (e) {
    e.preventDefault();
    window.reedcrm.eventpro.submitAddContact($(this));
  });
};

/**
 * Submit add contact form
 *
 * @memberof ReedCRM_EventPro
 *
 * @since   1.0.0
 * @version 1.1.0
 *
 * @param {jQuery} $button The submit button element
 */
window.reedcrm.eventpro.submitAddContact = function ($button) {
  var $form = $button.closest('.reedcrm-add-contact-form');
  var $mainForm = $form.closest('form');
  var $contactSelect = $mainForm.find('select[name="contactid"]');
  var socid = $mainForm.find('select[name="socid"]').val();

  var lastname = $form.find('#new_contact_lastname').val().trim();
  if (!lastname) {
    if (typeof window.saturne !== 'undefined' && window.saturne.notification) {
      window.saturne.notification.error('Le nom est obligatoire');
    }
    return;
  }

  if (!socid) {
    if (typeof window.saturne !== 'undefined' && window.saturne.notification) {
      window.saturne.notification.error('Veuillez sélectionner un tiers');
    }
    return;
  }

  var formData = {
    action: 'create_contact',
    token: $mainForm.find('input[name="token"]').val(),
    from_id: $mainForm.find('input[name="from_id"]').val(),
    from_type: $mainForm.find('input[name="from_type"]').val(),
    socid: socid,
    new_contact_lastname: lastname,
    new_contact_firstname: $form.find('#new_contact_firstname').val().trim(),
    new_contact_phone_pro: $form.find('#new_contact_phone_pro').val().trim(),
    new_contact_email: $form.find('#new_contact_email').val().trim()
  };

  $button.prop('disabled', true);

  var baseUrl = $mainForm.attr('action');
  if (baseUrl) {
    baseUrl = baseUrl.split('?')[0];
  } else {
    baseUrl = window.location.href.split('?')[0];
  }

  $.ajax({
    url: baseUrl,
    type: 'POST',
    data: formData,
    dataType: 'json',
    success: function (response) {
      if (response && response.success) {
        var newOption = new Option(response.contact_label, response.contact_id, true, true);
        $contactSelect.append(newOption).trigger('change');

        $form.slideUp();
        $form.find('input').val('');

        if (typeof window.saturne !== 'undefined' && window.saturne.notification) {
          window.saturne.notification.success('Contact créé avec succès');
        }
      } else {
        var errorMsg = (response && response.error) ? response.error : 'Erreur lors de la création du contact';
        if (typeof window.saturne !== 'undefined' && window.saturne.notification) {
          window.saturne.notification.error(errorMsg);
        }
      }
    },
    error: function (xhr, status, error) {
      console.error('AJAX Error:', xhr, status, error);
      var errorMsg = 'Erreur lors de la création du contact';
      try {
        if (xhr.responseText) {
          var errorResponse = JSON.parse(xhr.responseText);
          if (errorResponse.error) {
            errorMsg = errorResponse.error;
          }
        }
      } catch (e) {
        console.error('Error parsing response:', e);
      }

      if (typeof window.saturne !== 'undefined' && window.saturne.notification) {
        window.saturne.notification.error(errorMsg);
      }
    },
    complete: function () {
      $button.prop('disabled', false);
    }
  });
};
