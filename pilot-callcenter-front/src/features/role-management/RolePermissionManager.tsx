"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roleApi } from "@/entities/user/api/roleApi";
import { permissionApi } from "@/entities/permission/api/permissionApi";
import { toast, toastError } from "@/shared/lib/toast";
import { RoleFormDialog } from "./RoleFormDialog";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import type { Role } from "@/entities/user/model/types";
import type { Permission } from "@/entities/permission/model/types";

export function RolePermissionManager() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [roleForm, setRoleForm] = useState<Role | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const qc = useQueryClient();

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: roleApi.list,
  });

  const { data: allPermissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionApi.list(),
  });

  const { data: rolePermissions = [] } = useQuery({
    queryKey: ["role-permissions", selectedRole?.id],
    queryFn: () => roleApi.getPermissions(selectedRole!.id),
    enabled: !!selectedRole,
  });

  const permissionIdKey = rolePermissions.map((p) => p.id).sort().join(",");
  useEffect(() => {
    setCheckedIds(new Set(rolePermissions.map((p) => p.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionIdKey]);

  const saveMutation = useMutation({
    mutationFn: () => roleApi.setPermissions(selectedRole!.id, [...checkedIds]),
    onSuccess: () => {
      toast.success("권한이 저장되었습니다.");
      qc.invalidateQueries({ queryKey: ["role-permissions", selectedRole?.id] });
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => roleApi.delete(id),
    onSuccess: () => {
      toast.success("역할이 삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["roles"] });
      if (selectedRole?.id === deleteTarget?.id) setSelectedRole(null);
      setDeleteTarget(null);
    },
    onError: (e) => toastError(e, "삭제에 실패했습니다."),
  });

  const toggle = (id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = (perms: Permission[]) => {
    const ids = perms.map((p) => p.id);
    const allChecked = ids.every((id) => checkedIds.has(id));
    setCheckedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allChecked ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const grouped = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const key = p.category?.code ?? "기타";
    (acc[key] = acc[key] ?? []).push(p);
    return acc;
  }, {});

  const isDirty =
    selectedRole &&
    (checkedIds.size !== rolePermissions.length ||
      [...checkedIds].some((id) => !rolePermissions.find((p) => p.id === id)));

  return (
    <>
      <div className="flex gap-0 rounded-lg border border-border overflow-hidden min-h-[640px]">
        {/* Left: Role list */}
        <aside className="w-56 shrink-0 border-r border-border bg-muted/30 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">역할 목록</p>
            <button
              onClick={() => setRoleForm("new")}
              className="text-xs rounded-md px-2 py-1 bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
            >
              + 추가
            </button>
          </div>
          {rolesLoading ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">로딩 중...</p>
          ) : (
            <ul className="flex-1 overflow-y-auto">
              {roles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                return (
                  <li key={role.id} className={`group border-b border-border/50 last:border-0 ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <button
                        onClick={() => setSelectedRole(role)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="block text-sm truncate font-medium">{role.name}</span>
                          {role.systemRole && (
                            <span className={`shrink-0 text-[9px] font-bold px-1 py-px rounded ${isSelected ? "bg-primary-foreground/20 text-primary-foreground/80" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                              S
                            </span>
                          )}
                        </div>
                        <span className={`block text-xs font-mono truncate mt-0.5 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {role.code}
                        </span>
                      </button>
                      <div className={`flex gap-0.5 shrink-0 ml-1 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                        {/* 수정 아이콘 */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setRoleForm(role); }}
                          title="수정"
                          className={`rounded p-1 ${isSelected ? "hover:bg-primary-foreground/10 text-primary-foreground/80" : "hover:bg-accent text-muted-foreground hover:text-foreground"}`}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
                          </svg>
                        </button>
                        {/* 삭제 아이콘 — 시스템 롤은 숨김 */}
                        {!role.systemRole ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(role); }}
                            title="삭제"
                            className={`rounded p-1 ${isSelected ? "hover:bg-red-500/20 text-red-300" : "hover:bg-destructive/10 text-destructive/60 hover:text-destructive"}`}
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 011-1h4a1 1 0 011 1m-7 0H5m14 0h-2" />
                            </svg>
                          </button>
                        ) : (
                          <span className="w-[26px]" />
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Right: Permission checkboxes */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedRole ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              왼쪽에서 역할을 선택하세요
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div>
                  <span className="font-semibold">{selectedRole.name}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{selectedRole.code}</span>
                </div>
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={!isDirty || saveMutation.isPending}
                  className="rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  {saveMutation.isPending ? "저장 중..." : "저장"}
                </button>
              </div>

              {permsLoading ? (
                <p className="px-4 py-4 text-sm text-muted-foreground">로딩 중...</p>
              ) : (
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                  {Object.entries(grouped).map(([categoryCode, perms]) => {
                    const allChecked = perms.every((p) => checkedIds.has(p.id));
                    const someChecked = perms.some((p) => checkedIds.has(p.id));
                    return (
                      <div key={categoryCode}>
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id={`cat-${categoryCode}`}
                            checked={allChecked}
                            ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                            onChange={() => toggleAll(perms)}
                            className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                          />
                          <label
                            htmlFor={`cat-${categoryCode}`}
                            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none"
                          >
                            {perms[0]?.category?.name ?? categoryCode}
                          </label>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 pl-6">
                          {perms.map((p) => (
                            <label
                              key={p.id}
                              className="flex items-start gap-2 rounded-md px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={checkedIds.has(p.id)}
                                onChange={() => toggle(p.id)}
                                className="mt-0.5 h-4 w-4 rounded border-input accent-primary cursor-pointer"
                              />
                              <div>
                                <p className="text-sm font-medium leading-none">{p.name}</p>
                                <p className="text-xs font-mono text-muted-foreground mt-0.5">{p.code}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <RoleFormDialog
        open={roleForm !== null}
        role={roleForm === "new" ? null : roleForm}
        onClose={() => setRoleForm(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.name}' 역할을 삭제하시겠습니까?`}
        description="해당 역할을 가진 유저의 역할도 초기화될 수 있습니다."
        variant="destructive"
        confirmText="삭제"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
