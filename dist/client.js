import ReconnectingWebSocket from 'reconnecting-websocket';
import * as sharedb from 'sharedb/lib/client';
import * as richText from 'rich-text';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import * as tinycolor from "tinycolor2";
import ObjectID from 'bson-objectid';
sharedb.types.register(richText.type);
Quill.register('modules/cursors', QuillCursors);
const connectionButton = document.getElementById('client-connection');
connectionButton.addEventListener('click', function () {
    toggleConnection(connectionButton);
});
const nameInput = document.getElementById('name');
const colors = {};
const collection = 'examples';
const id = 'richtext';
const presenceId = new ObjectID().toString();
const socket = new ReconnectingWebSocket('ws://' + window.location.host, [], {
    // ShareDB handles dropped messages, and buffering them while the socket
    // is closed has undefined behavior
    maxEnqueuedMessages: 0
});
const connection = new sharedb.Connection(socket);
const doc = connection.get(collection, id);
doc.subscribe(function (err) {
    if (err)
        throw err;
    initialiseQuill(doc);
});
function initialiseQuill(doc) {
    const quill = new Quill('#editor', {
        theme: 'bubble',
        modules: { cursors: true }
    });
    const cursors = quill.getModule('cursors');
    quill.setContents(doc.data);
    quill.on('text-change', function (delta, oldDelta, source) {
        if (source !== 'user')
            return;
        doc.submitOp(delta);
    });
    doc.on('op', function (op, source) {
        if (source)
            return;
        quill.updateContents(op);
    });
    const presence = doc.connection.getDocPresence(collection, id);
    presence.subscribe(function (error) {
        if (error)
            throw error;
    });
    const localPresence = presence.create(presenceId);
    quill.on('selection-change', function (range, oldRange, source) {
        // We only need to send updates if the user moves the cursor
        // themselves. Cursor updates as a result of text changes will
        // automatically be handled by the remote client.
        if (source !== 'user')
            return;
        // Ignore blurring, so that we can see lots of users in the
        // same window. In real use, you may want to clear the cursor.
        if (!range)
            return;
        // In this particular instance, we can send extra information
        // on the presence object. This ability will vary depending on
        // type.
        range.name = nameInput.value;
        localPresence.submit(range, function (error) {
            if (error)
                throw error;
        });
    });
    presence.on('receive', function (id, range) {
        colors[id] = colors[id] || tinycolor.random().toHexString();
        const name = (range && range.name) || 'Anonymous';
        cursors.createCursor(id, name, colors[id]);
        cursors.moveCursor(id, range);
    });
    return quill;
}
function toggleConnection(button) {
    if (button.classList.contains('connected')) {
        button.classList.remove('connected');
        button.textContent = 'Connect';
        disconnect();
    }
    else {
        button.classList.add('connected');
        button.textContent = 'Disconnect';
        connect();
    }
}
function disconnect() {
    doc.connection.close();
}
function connect() {
    const socket = new ReconnectingWebSocket('ws://' + window.location.host);
    doc.connection.bindToSocket(socket);
}
//# sourceMappingURL=client.js.map