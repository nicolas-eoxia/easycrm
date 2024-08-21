/**
 * Initialise l'objet "control" ainsi que la méthode "init" obligatoire pour la bibliothèque EoxiaJS.
 *
 * @since   1.0.0
 * @version 1.0.0
 */
window.easycrm.project = {};

/**
 * La méthode appelée automatiquement par la bibliothèque EoxiaJS.
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.easycrm.project.init = function() {
    window.easycrm.project.event();
};

/**
 * La méthode contenant tous les événements pour le control.
 *
 * @since   1.0.0
 * @version 1.0.0
 *
 * @return {void}
 */
window.easycrm.project.event = function() {
    $( document ).on( 'click', '.fa-angle-down, .fa-angle-up', window.easycrm.project.updateProb );
};

/**
 * Show control info if toggle control info is on.
 *
 * @since   1.4.0
 * @version 1.4.0
 *
 * @param  {MouseEvent} event Les attributs lors du clic.
 * @return {void}
 */
window.easycrm.project.updateProb = function ( event ) {
    if ($(this).hasClass('fa-angle-up')) {
        var up = '&up';
    }
    var projectID = $(this).attr('data-project_id');
    var token = $('.fiche').find('input[name="token"]').val();
    var urlToGo = document.URL + '?action=update_prob&project_id=' + 8 + '&token=' + token + up;
    $.ajax({
        url: urlToGo,
        type: "POST",
        processData: false,
        contentType: false,
        success: function ( resp ) {
            //resp.html();
        },
        error: function ( ) {
        }
    });
}
