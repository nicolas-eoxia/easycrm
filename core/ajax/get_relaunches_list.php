<?php
/* Copyright (C) 2026 EVARISK <technique@evarisk.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * \file    core/ajax/get_relaunches_list.php
 * \ingroup reedcrm
 * \brief   AJAX endpoint to get filtered list of relaunches for tooltip
 */

// Load ReedCRM environment
if (file_exists('../../reedcrm.main.inc.php')) {
    require_once __DIR__ . '/../../reedcrm.main.inc.php';
} elseif (file_exists('../../../reedcrm.main.inc.php')) {
    require_once __DIR__ . '/../../../reedcrm.main.inc.php';
} else {
    die('Include of reedcrm main fails');
}

// Load Dolibarr libraries
require_once DOL_DOCUMENT_ROOT . '/projet/class/project.class.php';
require_once DOL_DOCUMENT_ROOT . '/comm/action/class/actioncomm.class.php';

// Global variables definitions
global $conf, $db, $langs, $user;

// Get parameters
$projectId      = GETPOSTINT('projectId');
$actionCommType = GETPOST('actionCommType', 'aZ09'); // AC_TEL, AC_EMAIL, AC_RDV, or other

if (empty($projectId) || empty($actionCommType)) {
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

// Initialize technical objects
$project    = new Project($db);
$actionComm = new ActionComm($db);

// Security check
if (!$user->hasRight('agenda', 'myactions', 'read') && !$user->hasRight('agenda', 'allactions', 'read')) {
    exit;
}

// Load project
if ($project->fetch($projectId) <= 0) {
    echo json_encode(['success' => false, 'error' => 'Project not found']);
    exit;
}

$filter      = ' AND a.code = "' . $actionCommType . '" AND a.id IN (SELECT c.fk_actioncomm FROM ' . MAIN_DB_PREFIX . 'categorie_actioncomm as c WHERE c.fk_categorie = ' . getDolGlobalInt('REEDCRM_ACTIONCOMM_COMMERCIAL_RELAUNCH_TAG') . ')';
$actionComms = $actionComm->getActions($project->socid, $projectId, 'project', $filter, 'a.datec');

if (is_string($actionComms)) {
    echo json_encode(['success' => false, 'error' => 'Error fetching actions: ' . $actionComms]);
    exit;
}

if (is_array($actionComms) && !empty($actionComms)) {
    print '<div class="reedcrm-relaunch-tooltip-content">';
    print '<table class="noborder centpercent">';

    foreach ($actionComms as $ac) {
        $contactName = '';
        if (!empty($ac->contact_id)) {
            require_once DOL_DOCUMENT_ROOT . '/contact/class/contact.class.php';
            $contact = new Contact($db);
            if ($contact->fetch($ac->contact_id) > 0) {
                $contactName = $contact->getFullName($langs);
            }
        }

        $userName = '';
        if (!empty($ac->userownerid)) {
            require_once DOL_DOCUMENT_ROOT . '/user/class/user.class.php';
            $userOwner = new User($db);
            if ($userOwner->fetch($ac->userownerid) > 0) {
                $userName = $userOwner->getFullName($langs);
            }
        }

        print '<tr class="oddeven">';
        print '<td class="nowrap">';
        print dol_print_date($ac->datep, 'dayhour', 'tzuser');
        print '</td>';
        print '<td class="tdoverflowmax200">';
        print '<strong>' . dol_escape_htmltag($ac->label) . '</strong>';
        if (!empty($ac->note_private)) {
            $note = dolGetFirstLineOfText(dol_string_nohtmltag($ac->note_private, 1));
            print '<br><span class="opacitymedium">' . dol_escape_htmltag(dol_trunc($note, 80)) . '</span>';
        }
        print '</td>';
        print '<td class="nowrap">';
        if ($contactName) {
            print '<span class="opacitymedium">' . img_picto('', 'contact', 'class="pictofixedwidth"') . ' ' . dol_escape_htmltag($contactName) . '</span>';
        }
        if ($userName) {
            if ($contactName) print '<br>';
            print '<span class="opacitymedium">' . img_picto('', 'user', 'class="pictofixedwidth"') . ' ' . dol_escape_htmltag($userName) . '</span>';
        }
        print '</td>';
        if (isset($ac->percentage) && $ac->percentage >= 100) {
            print '<td class="center">';
            print '<span class="badge badge-status4">' . $langs->trans('Done') . '</span>';
            print '</td>';
        } elseif (isset($ac->percentage) && $ac->percentage > 0) {
            print '<td class="center">';
            print '<span class="badge">' . $ac->percentage . '%</span>';
            print '</td>';
        } else {
            print '<td></td>';
        }
        print '</tr>';
    }

    print '</table>';
    print '</div>';
} else {
    print '<div class="reedcrm-relaunch-tooltip-empty">' . $langs->trans('NoEvents') . '</div>';
}
