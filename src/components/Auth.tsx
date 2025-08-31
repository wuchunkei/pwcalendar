import React, { useState } from 'react';
import {
    Box,
    Container,
    TextField,
    Button,
    Typography,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import type { ApiResponse } from '../types/user';

const API_BASE_URL = 'https://localhost:3000/api';

interface AuthProps {
    onLogin: (email: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [showChangePassword, setShowChangePassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (isLogin) {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });
                const data: ApiResponse<{ isFirstLogin: boolean }> = await response.json();
                
                if (data.success) {
                    if (data.data?.isFirstLogin) {
                        setShowChangePassword(true);
                    } else {
                        onLogin(email);
                    }
                } else {
                    setError(data.message);
                }
            } else {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, name }),
                });
                const data: ApiResponse = await response.json();
                
                if (data.success) {
                    setIsLogin(true);
                    setError('註冊成功，請查看郵箱獲取密碼');
                } else {
                    setError(data.message);
                }
            }
        } catch (error) {
            setError('操作失敗，請稍後重試');
        }
    };

    const handleChangePassword = async () => {
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(newPassword)) {
            setError('新密碼必須包含大小寫字母和數字，且長度不少於8位');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    oldPassword: password,
                    newPassword,
                }),
            });
            const data: ApiResponse = await response.json();
            
            if (data.success) {
                setShowChangePassword(false);
                onLogin(email);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('密碼修改失敗，請稍後重試');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2
            }}
        >
            <Container maxWidth="xs">
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                        {isLogin ? '登錄' : '創建賬戶'}
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="電子郵件地址"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={!!error}
                        />
                        {!isLogin && (
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="name"
                                label="姓名"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        )}
                        {isLogin && (
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="密碼"
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                error={!!error}
                            />
                        )}
                        {error && (
                            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                                {error}
                            </Typography>
                        )}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            {isLogin ? '下一步' : '創建賬戶'}
                        </Button>
                        <Button
                            fullWidth
                            variant="text"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                                setEmail('');
                                setName('');
                                setPassword('');
                            }}
                        >
                            {isLogin ? '創建賬戶' : '返回登錄'}
                        </Button>
                    </Box>
                </Paper>
            </Container>

            <Dialog 
                open={showChangePassword} 
                onClose={() => setShowChangePassword(false)}
                PaperProps={{
                    sx: {
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                    }
                }}
            >
                <DialogTitle>修改密碼</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        首次登錄需要修改密碼，新密碼必須包含大小寫字母和數字，且長度不少於8位。
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="newPassword"
                        label="新密碼"
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        error={!!error}
                        helperText={error}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowChangePassword(false)}>取消</Button>
                    <Button onClick={handleChangePassword} variant="contained">
                        確認
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};