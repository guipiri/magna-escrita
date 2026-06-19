import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Search, Plus, Mail, ShieldAlert, Building2, User, Pencil, Trash2 } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { UserRole, UpdateUserRequest, UserListResponse } from '@repo/shared';
import { getUsers, createUser, updateUser, deleteUser } from '../services/users-service';
import { getSchoolUnits } from '../services/schools-service';
import { getErrorMessage } from '../services/error-messages';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.SCHOOL);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Edit / Delete States
  const [editingUser, setEditingUser] = useState<UserListResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserListResponse | null>(null);

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  // Query to fetch user list
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  // Query to fetch available school units for the creation modal
  const {
    data: schools,
    isLoading: schoolsLoading,
    error: schoolsError,
  } = useQuery({
    queryKey: ['school-units'],
    queryFn: getSchoolUnits,
    enabled: createModalOpen,
  });

  // Mutation to create a new user
  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      enqueueSnackbar(`Usuário ${data.email} criado com sucesso!`, {
        variant: 'success',
      });
      // Invalidate queries to reload the user list
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Reset form and close dialog
      handleCloseModal();
    },
  });

  // Mutation to update an existing user
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      updateUser(id, data),
    onSuccess: (data) => {
      enqueueSnackbar(`Usuário ${data.email} editado com sucesso!`, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseModal();
    },
  });

  // Mutation to delete a user
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      enqueueSnackbar('Usuário excluído com sucesso!', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToDelete(null);
      setDeleteDialogOpen(false);
    },
    onError: (err) => {
      enqueueSnackbar(getErrorMessage(err) || 'Erro ao excluir usuário.', {
        variant: 'error',
      });
    },
  });

  // Filter the list of users locally based on search input
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return users;

    return users.filter((user) => {
      const emailMatch = user.email.toLowerCase().includes(normalizedSearch);
      const nameMatch = user.name?.toLowerCase().includes(normalizedSearch) || false;
      const roleMatch = user.role.toLowerCase().includes(normalizedSearch);
      const unitMatch = user.units.some(
          (unit) =>
            unit.name?.toLowerCase().includes(normalizedSearch) ||
            unit.schoolName.toLowerCase().includes(normalizedSearch),
        );

      return emailMatch || nameMatch || roleMatch || unitMatch;
    });
  }, [users, search]);

  // Compute metrics for header
  const counts = useMemo(() => {
    if (!users) return { total: 0, admins: 0, schools: 0 };
    return {
      total: users.length,
      admins: users.filter((u) => u.role === UserRole.ADMIN).length,
      schools: users.filter((u) => u.role === UserRole.SCHOOL).length,
    };
  }, [users]);

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setValidationError('O e-mail é obrigatório.');
      return;
    }

    if (role === UserRole.SCHOOL && selectedUnitIds.length === 0) {
      setValidationError('Um usuário com perfil de escola precisa estar associado a pelo menos uma unidade.');
      return;
    }

    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        data: {
          email: emailTrimmed,
          role,
          unitIds: role === UserRole.SCHOOL ? selectedUnitIds : [],
        },
      });
    } else {
      createUserMutation.mutate({
        email: emailTrimmed,
        role,
        unitIds: role === UserRole.SCHOOL ? selectedUnitIds : undefined,
      });
    }
  };

  const handleCloseModal = () => {
    setEmail('');
    setRole(UserRole.SCHOOL);
    setSelectedUnitIds([]);
    setValidationError(null);
    setEditingUser(null);
    createUserMutation.reset();
    updateUserMutation.reset();
    setCreateModalOpen(false);
  };

  const handleOpenEdit = (userItem: UserListResponse) => {
    setEditingUser(userItem);
    setEmail(userItem.email);
    setRole(userItem.role);
    setSelectedUnitIds(userItem.units.map((u) => u.id));
    setCreateModalOpen(true);
  };

  const handleOpenDelete = (userItem: UserListResponse) => {
    setUserToDelete(userItem);
    setDeleteDialogOpen(true);
  };

  if (usersLoading) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='rounded-3xl border border-border bg-card p-6 shadow-sm'>
            <p className='text-sm text-muted-foreground animate-pulse'>
              Carregando lista de usuários...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (usersError) {
    return (
      <main className='flex-1 overflow-auto'>
        <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'>
          <div className='rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm'>
            <p className='text-sm text-red-600'>
              Erro ao carregar usuários. Tente novamente mais tarde.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='flex-1 overflow-auto bg-background/95'>
      <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6'>
        
        {/* Page Header and Counters */}
        <section className='rounded-3xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6'>
          <div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
            <div className='space-y-2'>
              <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
                Usuários
              </h1>
              <p className='mt-2 text-sm text-muted-foreground'>
                Gerencie permissões de acesso ao sistema do Backoffice.
              </p>
              <div className='flex flex-wrap gap-2 pt-2'>
                <span className='inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary'>
                  Total: {counts.total}
                </span>
                <span className='inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-600 dark:text-violet-400'>
                  ADMIN: {counts.admins}
                </span>
                <span className='inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
                  ESCOLA: {counts.schools}
                </span>
              </div>
            </div>

            <div className='flex w-full flex-col gap-3 sm:max-w-md'>
              <div className='relative'>
                <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  type='search'
                  placeholder='Buscar por nome, e-mail ou escola...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='pl-9'
                />
              </div>

              <Button
                onClick={() => setCreateModalOpen(true)}
                className='w-full sm:w-auto sm:self-end flex items-center justify-center gap-1.5'
              >
                <Plus className='w-4 h-4' />
                Adicionar Usuário
              </Button>
            </div>
          </div>
        </section>

        {/* Users List Table */}
        <div className='rounded-3xl border border-border bg-card shadow-sm overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse'>
              <thead>
                <tr className='border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                  <th className='p-4 pl-6'>Usuário</th>
                  <th className='p-4'>Perfil</th>
                  <th className='p-4'>Unidades Associadas</th>
                  <th className='p-4 text-center'>Cadastro</th>
                  <th className='p-4 pr-6 text-right'>Ações</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/60 text-sm'>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className='p-8 text-center text-muted-foreground'>
                      Nenhum usuário correspondente encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((userItem) => (
                    <tr key={userItem.id} className='hover:bg-muted/10 transition-colors'>
                       <td className='p-4 pl-6'>
                        <div className='flex items-center gap-3'>
                          {userItem.picture ? (
                            <img
                              src={userItem.picture}
                              alt={userItem.name || 'avatar'}
                              className='w-9 h-9 rounded-full border border-border/80 object-cover'
                            />
                          ) : (
                            <div className='w-9 h-9 rounded-full bg-linear-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shadow-xs uppercase'>
                              {userItem.name ? userItem.name.substring(0, 2) : <User className='w-4 h-4' />}
                            </div>
                          )}
                          <div className='flex flex-col'>
                            <span className='font-medium text-foreground'>
                              {userItem.name || 'Pendente (Primeiro Login)'}
                            </span>
                            <span className='text-xs text-muted-foreground flex items-center gap-1 mt-0.5'>
                              <Mail className='w-3.5 h-3.5 shrink-0 opacity-60' />
                              {userItem.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className='p-4 vertical-middle'>
                        {userItem.role === UserRole.ADMIN ? (
                          <Badge variant='default' className='bg-violet-500 hover:bg-violet-600 text-white rounded-full px-2.5 py-0.5 border-transparent gap-1'>
                            <ShieldAlert className='w-3 h-3' />
                            ADMIN
                          </Badge>
                        ) : (
                          <Badge variant='secondary' className='bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-transparent rounded-full px-2.5 py-0.5 gap-1'>
                            <Building2 className='w-3 h-3' />
                            ESCOLA
                          </Badge>
                        )}
                      </td>
                      <td className='p-4 vertical-middle max-w-sm'>
                        {userItem.role === UserRole.ADMIN ? (
                          <span className='text-xs text-muted-foreground italic'>
                            Todos os acessos (Administrador)
                          </span>
                        ) : userItem.units.length === 0 ? (
                          <span className='text-xs text-destructive font-medium'>
                            Nenhuma unidade associada (Alerta!)
                          </span>
                        ) : (
                          <div className='flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1'>
                            {userItem.units.map((unit) => (
                              <span
                                key={unit.id}
                                className='inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-muted border border-border/80 text-muted-foreground font-medium'
                              >
                                {unit.schoolName} - {unit.name || 'Unidade principal'}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className='p-4 text-center text-xs text-muted-foreground vertical-middle'>
                        {new Date(userItem.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className='p-4 pr-6 text-right vertical-middle whitespace-nowrap'>
                        <div className='flex items-center justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-muted-foreground hover:text-foreground'
                            onClick={() => handleOpenEdit(userItem)}
                          >
                            <Pencil className='w-4 h-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-muted-foreground hover:text-destructive'
                            onClick={() => handleOpenDelete(userItem)}
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit User Dialog */}
        <Dialog open={createModalOpen} onOpenChange={handleCloseModal}>
          <DialogContent className='sm:max-w-lg' aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className='text-xl font-semibold text-foreground'>
                {editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className='space-y-4 py-2'>
              {/* Errors Block */}
              {(createUserMutation.isError || updateUserMutation.isError || validationError) && (
                <div className='p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium rounded-lg space-y-1'>
                  <p>
                    {validationError ||
                      getErrorMessage(createUserMutation.error || updateUserMutation.error) ||
                      'Erro ao salvar usuário. Verifique as informações.'}
                  </p>
                </div>
              )}

              {/* Email Input */}
              <div className='space-y-1.5'>
                <label className='block text-xs font-semibold text-foreground uppercase tracking-wider'>
                  E-mail do Usuário
                </label>
                <Input
                  type='email'
                  required
                  placeholder='exemplo@empresa.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                />
              </div>

              {/* Role Select Buttons */}
              <div className='space-y-2'>
                <label className='block text-xs font-semibold text-foreground uppercase tracking-wider'>
                  Perfil de Acesso
                </label>
                <div className='grid grid-cols-2 gap-3'>
                  <button
                    type='button'
                    onClick={() => {
                      setRole(UserRole.SCHOOL);
                      setValidationError(null);
                    }}
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                      role === UserRole.SCHOOL
                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/10'
                    }`}
                  >
                    <Building2 className='w-4 h-4' />
                    Coordenador Escola
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setRole(UserRole.ADMIN);
                      setValidationError(null);
                    }}
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                      role === UserRole.ADMIN
                        ? 'border-violet-500 bg-violet-500/5 text-violet-600 dark:text-violet-400'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/10'
                    }`}
                  >
                    <ShieldAlert className='w-4 h-4' />
                    Administrador Magna
                  </button>
                </div>
              </div>

              {/* Unit Association Selection (Visible only for SCHOOL role) */}
              {role === UserRole.SCHOOL && (
                <div className='space-y-2 border-t border-border/40 pt-3'>
                  <label className='block text-xs font-semibold text-foreground uppercase tracking-wider'>
                    Vincular Unidades Escolares (Pelo menos uma)
                  </label>
                  
                  {schoolsLoading ? (
                    <p className='text-xs text-muted-foreground animate-pulse py-2'>
                      Carregando unidades escolares...
                    </p>
                  ) : schoolsError ? (
                    <p className='text-xs text-red-500 py-2'>
                      Erro ao carregar unidades. Feche e abra o diálogo novamente.
                    </p>
                  ) : schools && schools.length === 0 ? (
                    <p className='text-xs text-amber-500 py-2'>
                      Nenhuma escola/unidade disponível para associação. Crie uma escola primeiro.
                    </p>
                  ) : (
                    <div className='space-y-4 max-h-56 overflow-y-auto border border-border/80 rounded-xl p-3 bg-muted/10 divide-y divide-border/40'>
                      {schools?.map((school) => (
                        <div key={school.id} className='space-y-2 pb-2.5 pt-2.5 first:pt-0 last:pb-0'>
                          <div className='flex items-center gap-1.5'>
                            <Building2 className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
                            <h4 className='text-xs font-bold text-foreground truncate'>
                              {school.name}
                            </h4>
                          </div>
                          <div className='grid grid-cols-1 gap-2 pl-5 sm:grid-cols-2'>
                            {school.units.map((unit) => {
                              const isChecked = selectedUnitIds.includes(unit.id);
                              return (
                                <label
                                  key={unit.id}
                                  className='flex items-start gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none py-0.5'
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedUnitIds([...selectedUnitIds, unit.id]);
                                      } else {
                                        setSelectedUnitIds(
                                          selectedUnitIds.filter((id) => id !== unit.id),
                                        );
                                      }
                                    }}
                                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                                  />
                                  <span className='leading-none pt-0.5 truncate'>
                                    {unit.name || 'Unidade principal'}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <DialogFooter className='border-t border-border/40 pt-4 mt-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleCloseModal}
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type='submit'
                  disabled={
                    createUserMutation.isPending ||
                    updateUserMutation.isPending ||
                    (role === UserRole.SCHOOL && selectedUnitIds.length === 0)
                  }
                >
                  {createUserMutation.isPending || updateUserMutation.isPending
                    ? 'Salvando...'
                    : editingUser
                    ? 'Salvar Alterações'
                    : 'Adicionar Usuário'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setUserToDelete(null);
            setDeleteDialogOpen(false);
          }
        }}>
          <DialogContent className='sm:max-w-md' aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className='text-xl font-semibold text-foreground flex items-center gap-2'>
                <Trash2 className='w-5 h-5 text-destructive' />
                Confirmar Exclusão
              </DialogTitle>
            </DialogHeader>

            <div className='py-4 space-y-3'>
              <p className='text-sm text-muted-foreground leading-relaxed'>
                Tem certeza que deseja excluir o usuário <span className='font-semibold text-foreground'>{userToDelete?.email}</span>?
              </p>
              <p className='text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3'>
                Esta ação é irreversível e removerá todos os acessos e vínculos associados a este usuário.
              </p>
            </div>

            <DialogFooter className='border-t border-border/40 pt-4 mt-2'>
              <Button
                type='button'
                variant='outline'
                disabled={deleteUserMutation.isPending}
                onClick={() => {
                  setUserToDelete(null);
                  setDeleteDialogOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                type='button'
                variant='destructive'
                disabled={deleteUserMutation.isPending}
                onClick={() => {
                  if (userToDelete) {
                    deleteUserMutation.mutate(userToDelete.id);
                  }
                }}
              >
                {deleteUserMutation.isPending ? 'Excluindo...' : 'Excluir Usuário'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
