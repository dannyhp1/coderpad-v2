
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import * as Constants from '../constants/config';
import { Grid, Button } from '@material-ui/core';
import Editor from './Editor';
import Results from './Results';

const borderRightStyle = { borderRight: '1px solid #a6d4fa' };
const borderLeftStyle = { borderLeft: '1px solid #a6d4fa' };

const errorMessage = 'Cannot connect to the code-with-me\'s server right now. Please try again later.';

// Setting socket settings.
let executeUrl, socketUrl, socket;
let socketOptions = Constants.SOCKET_OPTIONS;
switch(process.env.NODE_ENV) {
    case 'production':
        if (process.env.REACT_APP_USE_AWS === 'true') {
            socketUrl = Constants.PROD_SOCKET_AWS_ENDPOINT;
            socketOptions.path = Constants.PROD_SOCKET_AWS_PATH;
            executeUrl = Constants.PROD_EXECUTE_AWS_ENDPOINT;
        } else {
            socketUrl = Constants.PROD_SOCKET_HEROKU_ENDPOINT;
            executeUrl = Constants.PROD_EXECUTE_HEROKU_ENDPOINT;
        }
        break;
    default:
        socketUrl = Constants.DEV_SOCKET_ENDPOINT;
        executeUrl = Constants.DEV_EXECUTE_ENDPOINT;
}

function DualEditorWrapper(props) {
    const [connected, setConnected] = useState(false);
    const [amountConnectedUsers, setAmountConnectedUsers] = useState(0);
    const [firstUserCode, setFirstUserCode] = useState('');
    const [secondUserCode, setSecondUserCode] = useState('');
    const [userId, setUserId] = useState(0);
    const [roomId, setRoomId] = useState(0);

    useEffect(() => {
        // Get room parameters. Only allow room 1 and 2 for the time being.
        const fetchedRoomId = props.match.params.id;
        if (!['1', '2'].includes(fetchedRoomId)) {
            return;
        }
        setRoomId(parseInt(props.match.params.id));
        
        socket = io(socketUrl, socketOptions);
        socket.emit('room', { roomId: parseInt(fetchedRoomId), userId: userId });

        socket.on('connected', () => {
            console.log('Connected to the server\'s WebSocket.');
            setConnected(true);
        });

        socket.on('user_connected', (message) => {
            if (message.roomId === parseInt(props.match.params.id)) {
                setAmountConnectedUsers(message.total_users);
            }
        });

        socket.on('code_change', (message) => {
            if (message.roomId === parseInt(props.match.params.id)) {
                if (message.editorId === 1) {
                    setFirstUserCode(message.code);
                } else if(message.editorId === 2) {
                    setSecondUserCode(message.code);
                }
            }
        });

        return () => socket.disconnect();
    }, []);

    const transmitFirstUserCode = (message) => {
        console.log('Transmitting first user code...');
        socket.emit('code_change', {roomId: roomId, userId: userId, editorId: 1, code: message});
    };

    const updateFirstUserCode = (message) => {
        setFirstUserCode(message);
        transmitFirstUserCode(message);
    };

    const transmitSecondUserCode = (message) => {
        console.log('Transmitting second user code...');
        socket.emit('code_change', {roomId: roomId, userId: userId, editorId: 2, code: message});
    };

    const updateSecondUserCode = (message) => {
        setSecondUserCode(message);
        transmitSecondUserCode(message);
    }

    return (
        <div>
            <Grid container>
                <Grid item xs={6} style={borderRightStyle}>
                    <Editor source={firstUserCode} onChange={(message) => updateFirstUserCode(message)} height={'50vh'} />
                </Grid>
                <Grid item xs={6} style={borderLeftStyle}>
                    <Editor source={secondUserCode} onChange={(message) => updateSecondUserCode(message)} height={'50vh'} />
                </Grid>
            </Grid>

            <p>Connected: {connected ? 'true' : 'false'}</p>
            <p>User: {userId} </p>
            <p>Amount of users connected: {amountConnectedUsers} </p>
        </div>
    )

}

export default DualEditorWrapper;
