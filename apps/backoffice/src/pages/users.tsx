import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Plus,
  Mail,
  ShieldAlert,
  Building2,
  User,
  Pencil,
  Trash2,
  Loader2,
  RotateCw,
  MoreHorizontal,
} from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  DataList,
  DataListContent,
  DataListDescription,
  DataListHeader,
  DataListItem,
  DataListTitle,
} from '../components/ui/data-list';
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
    refetch,
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
          <div className='flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-10 text-center shadow-sm'>
            <Loader2 className='size-5 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>
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
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-destructive shadow-sm'>
            <p className='text-sm font-medium'>
              Erro ao carregar usuários. Tente novamente mais tarde.
            </p>
            <Button
              variant='outline'
              size='sm'
              onClick={() => refetch()}
              className='gap-2 text-destructive border-destructive/30 hover:bg-destructive/10'
            >
              <RotateCw className='size-3.5' />
              Recarregar
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='flex-1 overflow-auto'>
      <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6'
        >
          <div className='flex w-full gap-3 flex-wrap'>
            <div className='relative w-full flex-10'>
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
              className='w-full md:w-auto'
            >
              <Plus className='h-4 w-4' />
              Adicionar Usuário
            </Button>
          </div>
        </motion.section>

        <div className='mt-6'>
          {filteredUsers.length === 0 ? (
            <div className='rounded-xl border border-dashed border-border bg-card p-10 text-center'>
              <div className='mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <User className='size-5' />
              </div>
              <p className='text-sm font-medium text-foreground'>
                Nenhum usuário encontrado
              </p>
              <p className='mt-1 text-sm text-muted-foreground'>
                Nenhum usuário corresponde ao filtro atual.
              </p>
            </div>
          ) : (
            <DataList>
              {filteredUsers.map((userItem) => (
                <DataListItem key={userItem.id}>
                  <DataListHeader className='mb-4 flex items-start'>
                    <div className='flex items-center gap-3 min-w-0'>
                      {userItem.picture ? (
                        <img
                          src={userItem.picture}
                          alt={userItem.name || 'avatar'}
                          className='size-10 rounded-full border border-border object-cover shrink-0'
                        />
                      ) : (
                        <div className='size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold uppercase shrink-0'>
                          {userItem.name ? (
                            userItem.name.substring(0, 2)
                          ) : (
                            <User className='size-4' />
                          )}
                        </div>
                      )}
                      <div className='min-w-0'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <DataListTitle className='truncate'>
                            {userItem.name || 'Pendente (Primeiro Login)'}
                          </DataListTitle>
                          {userItem.role === UserRole.ADMIN ? (
                            <Badge variant='default'>
                              <ShieldAlert className='size-3 mr-1' />
                              ADMIN
                            </Badge>
                          ) : (
                            <Badge variant='secondary'>
                              <Building2 className='size-3 mr-1' />
                              ESCOLA
                            </Badge>
                          )}
                        </div>
                        <DataListDescription className='mt-0.5 flex items-center gap-1.5'>
                          <Mail className='size-3.5 opacity-70' />
                          {userItem.email}
                        </DataListDescription>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className='h-8 w-8 p-0'
                          variant='ghost'
                          size='icon'
                          aria-label='Ações do usuário'
                        >
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        onCloseAutoFocus={(e) => e.preventDefault()}
                      >
                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(userItem)}
                        >
                          <Pencil className='mr-2 h-4 w-4' />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleOpenDelete(userItem)}
                          className='text-destructive focus:text-destructive'
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </DataListHeader>

                  <DataListContent className='sm:grid-cols-3'>
                    <div className='rounded-lg border border-border/70 bg-muted/20 p-3'>
                      <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                        <Mail className='h-4 w-4' />
                        <span className='text-xs font-medium uppercase tracking-wide'>
                          E-mail
                        </span>
                      </div>
                      <p className='text-sm font-semibold text-foreground truncate'>
                        {userItem.email}
                      </p>
                    </div>

                    <div className='rounded-lg border border-border/70 bg-muted/20 p-3'>
                      <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                        <ShieldAlert className='h-4 w-4' />
                        <span className='text-xs font-medium uppercase tracking-wide'>
                          Perfil / Acesso
                        </span>
                      </div>
                      <p className='text-sm font-semibold text-foreground'>
                        {userItem.role === UserRole.ADMIN
                          ? 'Administrador'
                          : 'Escola'}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Desde{' '}
                        {new Date(userItem.createdAt).toLocaleDateString(
                          'pt-BR',
                        )}
                      </p>
                    </div>

                    <div className='rounded-lg border border-border/70 bg-muted/20 p-3'>
                      <div className='mb-1 flex items-center gap-2 text-muted-foreground'>
                        <Building2 className='h-4 w-4' />
                        <span className='text-xs font-medium uppercase tracking-wide'>
                          Unidades Vinculadas
                        </span>
                      </div>
                      {userItem.role === UserRole.ADMIN ? (
                        <p className='text-xs text-muted-foreground italic'>
                          Acesso a todas as unidades
                        </p>
                      ) : userItem.units.length === 0 ? (
                        <p className='text-xs text-destructive font-medium'>
                          Nenhuma unidade associada
                        </p>
                      ) : (
                        <div className='flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto'>
                          {userItem.units.map((unit) => (
                            <span
                              key={unit.id}
                              className='inline-flex items-center rounded border border-border/40 bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground'
                            >
                              {unit.schoolName} -{' '}
                              {unit.name || 'Unidade principal'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </DataListContent>
                </DataListItem>
              ))}
            </DataList>
          )}
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
                    <p className='text-xs text-destructive py-2'>
                      Erro ao carregar unidades. Feche e abra o diálogo novamente.
                    </p>
                  ) : schools && schools.length === 0 ? (
                    <p className='text-xs text-warning-foreground py-2'>
                      Nenhuma escola/unidade disponível para associação. Crie uma escola primeiro.
                    </p>
                  ) : (
                    <div className='space-y-4 max-h-56 overflow-y-auto border border-border/80 rounded-lg p-3 bg-muted/10 divide-y divide-border/40'>
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
    </main>
  );
}
