/**
 * sseManager.js
 * Manages Server-Sent Events connections for real-time push to members and owners.
 *
 * Connection maps:
 *   memberClients: memberId (string) → Set<res>
 *   ownerClients:  ownerId  (string) → Set<res>
 *   gymClients:    gymId    (string) → Set<res>  ← gym-scoped broadcast
 *
 * Usage (in controllers):
 *   const { sendToMember, sendToOwner, sendToGym } = require('../utils/sseManager');
 *   sendToMember(memberId, 'renewal_approved', { expiryDate: ... });
 *   sendToGym(gymId, 'store_updated', { action: 'product_added' });
 */

const memberClients = new Map(); // memberId → Set<res>
const ownerClients  = new Map(); // ownerId  → Set<res>
const gymClients    = new Map(); // gymId    → Set<res>  (active member connections grouped by gym)

// ── Internal helpers ────────────────────────────────────────────────────────

function _addToMap(map, id, res) {
    const key = String(id);
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(res);
}

function _removeFromMap(map, id, res) {
    const key = String(id);
    const set = map.get(key);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) map.delete(key);
}

function _writeEvent(res, eventName, data) {
    try {
        res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
        // Client already disconnected — ignore
    }
}

function _sendToMap(map, id, eventName, data) {
    const set = map.get(String(id));
    if (!set || set.size === 0) return;
    for (const res of set) {
        _writeEvent(res, eventName, data);
    }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Register a member's SSE response object.
 * Also registers the connection in gymClients so sendToGym() works without
 * a DB fan-out query.
 *
 * @param {string|ObjectId} memberId
 * @param {string|ObjectId} gymId   - The member's gym (resolved once at connect time)
 * @param {object}          res     - Express response object (kept open for SSE)
 */
function addMemberClient(memberId, gymId, res) {
    _addToMap(memberClients, memberId, res);
    if (gymId) _addToMap(gymClients, gymId, res);
    // Attach gymId to res so we can clean up gymClients on disconnect
    res._sseGymId = String(gymId || '');
}

/**
 * Unregister a member's SSE response object.
 * Cleans up both memberClients and gymClients.
 *
 * @param {string|ObjectId} memberId
 * @param {object}          res
 */
function removeMemberClient(memberId, res) {
    _removeFromMap(memberClients, memberId, res);
    // Use the gymId stored on the res object at connect time
    if (res._sseGymId) {
        _removeFromMap(gymClients, res._sseGymId, res);
    }
}

/**
 * Register an owner's SSE response object.
 */
function addOwnerClient(ownerId, res) {
    _addToMap(ownerClients, ownerId, res);
}

/**
 * Unregister an owner's SSE response object.
 */
function removeOwnerClient(ownerId, res) {
    _removeFromMap(ownerClients, ownerId, res);
}

/**
 * Send a named event to all open connections for a member.
 * @param {string|ObjectId} memberId
 * @param {string} eventName  e.g. 'renewal_approved'
 * @param {Object} data       Plain JSON-serializable payload
 */
function sendToMember(memberId, eventName, data = {}) {
    _sendToMap(memberClients, memberId, eventName, data);
}

/**
 * Send a named event to all open connections for an owner.
 */
function sendToOwner(ownerId, eventName, data = {}) {
    _sendToMap(ownerClients, ownerId, eventName, data);
}

/**
 * Send a named event to ALL currently-connected members of a gym.
 * This is the preferred way to broadcast store/plan changes — it avoids
 * querying the DB for every member's ID and only pushes to clients that
 * are actually online right now.
 *
 * @param {string|ObjectId} gymId
 * @param {string}          eventName  e.g. 'store_updated'
 * @param {Object}          data       Plain JSON-serializable payload
 */
function sendToGym(gymId, eventName, data = {}) {
    _sendToMap(gymClients, gymId, eventName, data);
}

/**
 * Diagnostics — number of active SSE connections.
 */
function getStats() {
    let memberConns = 0;
    let ownerConns  = 0;
    let gymEntries  = 0;
    for (const set of memberClients.values()) memberConns += set.size;
    for (const set of ownerClients.values())  ownerConns  += set.size;
    for (const set of gymClients.values())    gymEntries  += set.size;
    return { memberConns, ownerConns, gymEntries };
}

module.exports = {
    addMemberClient,
    removeMemberClient,
    addOwnerClient,
    removeOwnerClient,
    sendToMember,
    sendToOwner,
    sendToGym,
    getStats
};
