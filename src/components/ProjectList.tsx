import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Grid,
    Badge,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// 暫時移除 DeleteIcon 導入，使用文本替代
// import DeleteIcon from '@mui/icons-material/Delete';
import type { Project } from '../types/project';
import { ProjectDetail } from './ProjectDetail';

const API_BASE_URL = 'https://localhost:3000/api';

interface ProjectListProps {
    userEmail: string;
}

export const ProjectList: React.FC<ProjectListProps> = ({ userEmail }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [invitingProjectId, setInvitingProjectId] = useState<string | null>(null);
    const [inviteeEmail, setInviteeEmail] = useState('');
    const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
    const [newProject, setNewProject] = useState({
        name: '',
        location: '',
        launchDate: null as Date | null,
        editors: [] as string[]
    });

    useEffect(() => {
        fetchProjects();
        fetchInvitations();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/projects?email=${userEmail}`);
            const data = await response.json();
            if (data.success) {
                setProjects(data.data);
            }
        } catch (error) {
            console.error('獲取項目列表失敗:', error);
        }
    };
    
    const fetchInvitations = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/projects/invitations?email=${userEmail}`);
            const data = await response.json();
            if (data.success) {
                setInvitations(data.data);
            }
        } catch (error) {
            console.error('獲取邀請列表失敗:', error);
        }
    };
    
    const handleSendInvitation = async () => {
        if (!invitingProjectId || !inviteeEmail) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/projects/${invitingProjectId}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inviteeEmail,
                }),
            });
            
            const data = await response.json();
            if (data.success) {
                alert('邀請已發送！');
                setInviteDialogOpen(false);
                setInviteeEmail('');
                setInvitingProjectId(null);
            } else {
                alert('發送邀請失敗: ' + data.message);
            }
        } catch (error) {
            console.error('發送邀請失敗:', error);
            alert('發送邀請失敗，請稍後再試。');
        }
    };
    
    const handleAcceptInvitation = async (invitationId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/projects/invitations/${invitationId}/accept`, {
                method: 'POST',
            });
            
            const data = await response.json();
            if (data.success) {
                alert('已接受邀請！');
                fetchInvitations();
                fetchProjects();
            } else {
                alert('接受邀請失敗: ' + data.message);
            }
        } catch (error) {
            console.error('接受邀請失敗:', error);
            alert('接受邀請失敗，請稍後再試。');
        }
    };
    
    const handleRejectInvitation = async (invitationId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/projects/invitations/${invitationId}/reject`, {
                method: 'POST',
            });
            
            const data = await response.json();
            if (data.success) {
                alert('已拒絕邀請！');
                fetchInvitations();
            } else {
                alert('拒絕邀請失敗: ' + data.message);
            }
        } catch (error) {
            console.error('拒絕邀請失敗:', error);
            alert('拒絕邀請失敗，請稍後再試。');
        }
    };

    const handleCheckboxChange = (projectId: string) => {
        // 允許在項目詳情打開時也能選擇項目
        setSelectedProjects(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const handleCreateProject = async () => {
        try {
            const launchDateStr = newProject.launchDate 
                ? new Date(newProject.launchDate).toLocaleDateString() 
                : '未設定';
                
            const response = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newProject.name,
                    description: `地點：${newProject.location}\n啟動時間：${launchDateStr}`,
                    creatorEmail: userEmail,
                }),
            });

            const data = await response.json();
            if (data.success) {
                // 如果有編輯者，發送邀請
                if (newProject.editors.length > 0) {
                    await Promise.all(
                        newProject.editors.map(editor =>
                            fetch(`${API_BASE_URL}/projects/${data.data._id}/invite`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ inviteeEmail: editor }),
                            })
                        )
                    );
                }

                setCreateDialogOpen(false);
                setNewProject({ name: '', location: '', launchDate: null, editors: [] });
                fetchProjects();
            }
        } catch (error) {
            console.error('創建項目失敗:', error);
        }
    };

    const handleDeleteProjects = async () => {
        if (selectedProjects.length === 0) return;
        
        try {
            await Promise.all(
                selectedProjects.map(projectId => 
                    fetch(`${API_BASE_URL}/projects/${projectId}`, {
                        method: 'DELETE'
                    })
                )
            );
            setSelectedProjects([]);
            fetchProjects();
        } catch (error) {
            console.error('刪除項目失敗:', error);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ mt: 4, mb: 2, width: '100%', maxWidth: '900px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    項目列表
                </Typography>
                <Box>
                    <Button
                        variant="contained"
                        onClick={() => setCreateDialogOpen(true)}
                        sx={{ bgcolor: '#4caf50', mr: 2 }}
                    >
                        創建項目
                    </Button>
                    <Badge badgeContent={invitations.filter(inv => inv.status === 'pending').length} color="error" sx={{ mr: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setInviteDialogOpen(true)}
                            disabled={invitations.filter(inv => inv.status === 'pending').length === 0}
                        >
                            邀請({invitations.filter(inv => inv.status === 'pending').length})
                        </Button>
                    </Badge>
                        <Button
                            variant="contained"
                            onClick={() => {
                                if (selectedProjects.length === 1) {
                                    setSelectedProjectId(selectedProjects[0]);
                                }
                            }}
                            disabled={selectedProjects.length !== 1}
                            sx={{ bgcolor: selectedProjects.length === 1 ? '#666666' : undefined, mr: 2 }}
                        >
                            編輯
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDeleteProjects}
                            disabled={selectedProjects.length === 0}
                        >
                            刪除
                        </Button>
                    </Box>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ width: '100%', maxWidth: '900px' }}>
                {projects.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography>目前沒有項目</Typography>
                    </Box>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox"></TableCell>
                                <TableCell>項目名稱</TableCell>
                                <TableCell>項目創建人</TableCell>
                                <TableCell>啟動時間</TableCell>
                                <TableCell>更新時間</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {projects.map((project) => {
                                const isItemSelected = selectedProjects.includes(project._id);
                                const descriptionLines = project.description ? project.description.split('\n') : [];
                                const locationLine = descriptionLines.find(line => line.startsWith('地點：'));
                                const launchDateLine = descriptionLines.find(line => 
                                    line.startsWith('啟動時間：') || line.startsWith('持續時間：')
                                );
                                const location = locationLine ? locationLine.replace('地點：', '') : '';
                                const launchDate = launchDateLine ? 
                                    launchDateLine.replace('啟動時間：', '').replace('持續時間：', '') : 
                                    '未設定';

                                return (
                                    <React.Fragment key={project._id}>
                                        <TableRow
                                            selected={isItemSelected}
                                            onClick={() => handleCheckboxChange(project._id)}
                                            hover
                                            sx={{
                                                cursor: 'pointer',
                                                '&.Mui-selected': {
                                                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                                },
                                                '&.Mui-selected:hover': {
                                                    backgroundColor: 'rgba(25, 118, 210, 0.12)',
                                                }
                                            }}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={isItemSelected}
                                                    onChange={() => handleCheckboxChange(project._id)}
                                                    onClick={(event) => event.stopPropagation()}
                                                />
                                            </TableCell>
                                            <TableCell>{project.name}</TableCell>
                                            <TableCell>{project.creator}</TableCell>
                                            <TableCell>{launchDate}</TableCell>
                                            <TableCell>
                                                {new Date(project.updatedAt).toLocaleString()}
                                                <Box sx={{ display: 'inline-flex', ml: 2 }}>
                                                    <Button 
                                                        size="small" 
                                                        variant="outlined" 
                                                        color="primary" 
                                                        sx={{ mr: 1, minWidth: '60px' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // 分享項目的邏輯
                                                            const calendarUrl = `${window.location.origin}/api/projects/${project._id}/calendar.ics`;
                                                            navigator.clipboard.writeText(calendarUrl)
                                                                .then(() => {
                                                                    alert('日曆訂閱鏈接已複製到剪貼板！');
                                                                })
                                                                .catch(err => {
                                                                    console.error('複製到剪貼板失敗:', err);
                                                                    // 如果複製失敗，則回退到原來的方式
                                                                    window.open(calendarUrl, '_blank');
                                                                });
                                                        }}
                                                    >
                                                        分享
                                                    </Button>
                                                    <Button 
                                                        size="small" 
                                                        variant="outlined" 
                                                        color="success" 
                                                        sx={{ mr: 1, minWidth: '60px' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setInvitingProjectId(project._id);
                                                            setInviteDialogOpen(true);
                                                        }}
                                                    >
                                                        邀請
                                                    </Button>
                                                    <Button 
                                                        size="small" 
                                                        variant="outlined" 
                                                        color="info" 
                                                        sx={{ minWidth: '60px' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // 切換詳情顯示狀態
                                                            if (selectedProjectId === project._id) {
                                                                // 如果當前已經顯示詳情，則關閉
                                                                setSelectedProjectId(null);
                                                            } else {
                                                                // 否則顯示詳情
                                                                setSelectedProjectId(project._id);
                                                                setSelectedProjects([]);
                                                            }
                                                        }}
                                                    >
                                                        詳細
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                        {selectedProjectId === project._id && (
                                            <TableRow>
                                                <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                                                    <Box sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
                                                        <ProjectDetail
                                                            projectId={project._id}
                                                            userEmail={userEmail}
                                                            onBack={() => {
                                                                setSelectedProjectId(null);
                                                                setSelectedProjects([]);
                                                            }}
                                                        />
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>

            <Dialog open={isCreateDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>創建新項目</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="項目名稱"
                        type="text"
                        fullWidth
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="地點"
                        type="text"
                        fullWidth
                        value={newProject.location}
                        onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="啟動時間"
                            value={newProject.launchDate}
                            onChange={(date) => setNewProject({ ...newProject, launchDate: date })}
                            slotProps={{ 
                                textField: { 
                                    fullWidth: true,
                                    margin: "dense",
                                    sx: { mb: 2 }
                                } 
                            }}
                        />
                    </LocalizationProvider>
                    <TextField
                        margin="dense"
                        label="編輯者郵箱（多個郵箱用逗號分隔）"
                        fullWidth
                        value={newProject.editors.join(',')}
                        onChange={(e) => setNewProject({
                            ...newProject,
                            editors: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                        })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>取消</Button>
                    <Button onClick={handleCreateProject} variant="contained">
                        創建
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 邀請用戶對話框 */}
            <Dialog open={isInviteDialogOpen && !!invitingProjectId} onClose={() => setInviteDialogOpen(false)}>
                <DialogTitle>邀請用戶</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="用戶郵箱"
                        type="email"
                        fullWidth
                        value={inviteeEmail}
                        onChange={(e) => setInviteeEmail(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInviteDialogOpen(false)}>取消</Button>
                    <Button onClick={handleSendInvitation}>發送邀請</Button>
                </DialogActions>
            </Dialog>

            {/* 查看邀請對話框 */}
            <Dialog open={isInviteDialogOpen && !invitingProjectId} onClose={() => setInviteDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>項目邀請</DialogTitle>
                <DialogContent>
                    {invitations.filter(inv => inv.status === 'pending').length === 0 ? (
                        <Typography>目前沒有待處理的邀請</Typography>
                    ) : (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>項目名稱</TableCell>
                                        <TableCell>邀請者</TableCell>
                                        <TableCell>邀請時間</TableCell>
                                        <TableCell>操作</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {invitations.filter(inv => inv.status === 'pending').map((invitation) => {
                                        const project = projects.find(p => p._id === invitation.projectId);
                                        return (
                                            <TableRow key={invitation._id}>
                                                <TableCell>{project ? project.name : invitation.projectId}</TableCell>
                                                <TableCell>{invitation.inviterName || '未知用戶'}</TableCell>
                                                <TableCell>{new Date(invitation.createdAt).toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Button 
                                                        variant="contained" 
                                                        color="success" 
                                                        size="small" 
                                                        sx={{ mr: 1 }}
                                                        onClick={() => handleAcceptInvitation(invitation._id)}
                                                    >
                                                        接受
                                                    </Button>
                                                    <Button 
                                                        variant="contained" 
                                                        color="error" 
                                                        size="small"
                                                        onClick={() => handleRejectInvitation(invitation._id)}
                                                    >
                                                        拒絕
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInviteDialogOpen(false)}>關閉</Button>
                </DialogActions>
            </Dialog>

            {/* 編輯項目對話框 */}
            <Dialog open={!!selectedProjectId && selectedProjects.length === 1} onClose={() => {
                setSelectedProjectId(null);
                setSelectedProjects([]);
            }} maxWidth="sm" fullWidth>
                <DialogTitle>編輯項目</DialogTitle>
                <DialogContent>
                    {selectedProjectId && (
                        <Box sx={{ mt: 2 }}>
                            <TextField
                                margin="dense"
                                label="項目名稱"
                                type="text"
                                fullWidth
                                value={projects.find(p => p._id === selectedProjectId)?.name || ''}
                                onChange={(e) => {
                                    const updatedProjects = projects.map(p => 
                                        p._id === selectedProjectId ? {...p, name: e.target.value} : p
                                    );
                                    setProjects(updatedProjects);
                                }}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                margin="dense"
                                label="地點"
                                type="text"
                                fullWidth
                                value={(() => {
                                    const project = projects.find(p => p._id === selectedProjectId);
                                    if (!project) return '';
                                    const descriptionLines = project.description ? project.description.split('\n') : [];
                                    const locationLine = descriptionLines.find(line => line.startsWith('地點：'));
                                    return locationLine ? locationLine.replace('地點：', '') : '';
                                })()}
                                onChange={(e) => {
                                    const project = projects.find(p => p._id === selectedProjectId);
                                    if (!project) return;
                                    
                                    const descriptionLines = project.description ? project.description.split('\n') : [];
                                    const locationLineIndex = descriptionLines.findIndex(line => line.startsWith('地點：'));
                                    const launchDateLine = descriptionLines.find(line => 
                                        line.startsWith('啟動時間：') || line.startsWith('持續時間：')
                                    );
                                    
                                    let newDescriptionLines = [...descriptionLines];
                                    if (locationLineIndex >= 0) {
                                        newDescriptionLines[locationLineIndex] = `地點：${e.target.value}`;
                                    } else {
                                        newDescriptionLines.push(`地點：${e.target.value}`);
                                    }
                                    
                                    const updatedProjects = projects.map(p => 
                                        p._id === selectedProjectId ? 
                                        {...p, description: newDescriptionLines.join('\n')} : p
                                    );
                                    setProjects(updatedProjects);
                                }}
                                sx={{ mb: 2 }}
                            />
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="啟動時間"
                                    value={(() => {
                                        const project = projects.find(p => p._id === selectedProjectId);
                                        if (!project) return null;
                                        const descriptionLines = project.description ? project.description.split('\n') : [];
                                        const launchDateLine = descriptionLines.find(line => 
                                            line.startsWith('啟動時間：') || line.startsWith('持續時間：')
                                        );
                                        const launchDateStr = launchDateLine ? 
                                            launchDateLine.replace('啟動時間：', '').replace('持續時間：', '') : 
                                            null;
                                        return launchDateStr && launchDateStr !== '未設定' ? new Date(launchDateStr) : null;
                                    })()}
                                    onChange={(date) => {
                                        const project = projects.find(p => p._id === selectedProjectId);
                                        if (!project) return;
                                        
                                        const descriptionLines = project.description ? project.description.split('\n') : [];
                                        const launchDateLineIndex = descriptionLines.findIndex(line => 
                                            line.startsWith('啟動時間：') || line.startsWith('持續時間：')
                                        );
                                        
                                        const launchDateStr = date 
                                            ? new Date(date).toLocaleDateString() 
                                            : '未設定';
                                        
                                        let newDescriptionLines = [...descriptionLines];
                                        if (launchDateLineIndex >= 0) {
                                            newDescriptionLines[launchDateLineIndex] = `啟動時間：${launchDateStr}`;
                                        } else {
                                            newDescriptionLines.push(`啟動時間：${launchDateStr}`);
                                        }
                                        
                                        const updatedProjects = projects.map(p => 
                                            p._id === selectedProjectId ? 
                                            {...p, description: newDescriptionLines.join('\n')} : p
                                        );
                                        setProjects(updatedProjects);
                                    }}
                                    slotProps={{ 
                                        textField: { 
                                            fullWidth: true,
                                            margin: "dense",
                                            sx: { mb: 2 }
                                        } 
                                    }}
                                />
                            </LocalizationProvider>
                            <TextField
                                margin="dense"
                                label="編輯者郵箱（多個郵箱用逗號分隔）"
                                fullWidth
                                value={(() => {
                                    const project = projects.find(p => p._id === selectedProjectId);
                                    return project?.editors?.join(',') || '';
                                })()}
                                onChange={(e) => {
                                    const editors = e.target.value.split(',').map(email => email.trim()).filter(Boolean);
                                    const updatedProjects = projects.map(p => 
                                        p._id === selectedProjectId ? {...p, editors} : p
                                    );
                                    setProjects(updatedProjects);
                                }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setSelectedProjectId(null);
                        setSelectedProjects([]);
                        fetchProjects(); // 重新獲取項目列表，放棄更改
                    }}>取消</Button>
                    <Button onClick={async () => {
                        if (!selectedProjectId) return;
                        
                        const project = projects.find(p => p._id === selectedProjectId);
                        if (!project) return;
                        
                        try {
                            // 更新項目基本信息
                            const response = await fetch(`${API_BASE_URL}/projects/${selectedProjectId}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    name: project.name,
                                    description: project.description,
                                }),
                            });
                            
                            const data = await response.json();
                            if (data.success) {
                                // 處理編輯者更新
                                if (project.editors && project.editors.length > 0) {
                                    // 獲取當前項目的編輯者
                                    const currentEditorsResponse = await fetch(`${API_BASE_URL}/projects/${selectedProjectId}/editors`);
                                    const currentEditorsData = await currentEditorsResponse.json();
                                    const currentEditors = currentEditorsData.success ? currentEditorsData.data : [];
                                    
                                    // 找出需要添加的新編輯者
                                    const currentEditorEmails = currentEditors.map(editor => editor.email);
                                    const newEditors = project.editors.filter(email => !currentEditorEmails.includes(email));
                                    
                                    // 找出需要刪除的編輯者
                                    const editorsToRemove = currentEditors.filter(editor => 
                                        !project.editors.includes(editor.email) && editor.email !== userEmail
                                    );
                                    
                                    // 添加新編輯者
                                    await Promise.all(
                                        newEditors.map(editor =>
                                            fetch(`${API_BASE_URL}/projects/${selectedProjectId}/invite`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({ inviteeEmail: editor }),
                                            })
                                        )
                                    );
                                    
                                    // 刪除編輯者
                                    await Promise.all(
                                        editorsToRemove.map(editor =>
                                            fetch(`${API_BASE_URL}/projects/${selectedProjectId}/editors/${editor._id}`, {
                                                method: 'DELETE',
                                            })
                                        )
                                    );
                                }
                                
                                setSelectedProjectId(null);
                                setSelectedProjects([]);
                                fetchProjects();
                            }
                        } catch (error) {
                            console.error('更新項目失敗:', error);
                        }
                    }} variant="contained">
                        保存
                    </Button>
                </DialogActions>
            </Dialog>
            
        </Container>
    );
};