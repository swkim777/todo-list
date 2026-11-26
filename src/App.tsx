import React, { useState } from 'react';
import { useTodos } from './hooks/useTodos';
import { Header } from './components/Header';
import { TodoInput } from './components/TodoInput';
import { FilterAndSearch } from './components/FilterAndSearch';
import { TodoList } from './components/TodoList';
import { Footer } from './components/Footer';
import { UndoToast } from './components/UndoToast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { CorruptedAlert } from './components/CorruptedAlert';
import styles from './App.module.css';

export const App: React.FC = () => {
  const {
    tasks,
    filteredTasks,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    undoItem,
    storageError,
    corruptedError,
    rawBackup,
    lastAddedHidden,
    clearLastAddedHidden,
    addTodo,
    toggleTodo,
    updateTodoText,
    deleteTodo,
    undoDelete,
    dismissUndo,
    clearCompleted,
    resetCorruptedData,
    retrySave,
    stats,
  } = useTodos();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTrigger, setConfirmTrigger] = useState<HTMLElement | null>(null);

  const handleOpenConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    setConfirmTrigger(e.currentTarget);
    setIsConfirmOpen(true);
  };

  const handleConfirmClear = () => {
    clearCompleted();
    setIsConfirmOpen(false);
  };

  const handleCancelClear = () => {
    setIsConfirmOpen(false);
  };

  const handleFocusInput = () => {
    const input = document.getElementById('new-todo-input');
    input?.focus();
  };

  return (
    <main className={styles.appContainer}>
      <div className={styles.card}>
        <Header
          total={stats.total}
          completed={stats.completed}
          percentage={stats.percentage}
        />

        {corruptedError && (
          <CorruptedAlert
            error={corruptedError}
            rawBackup={rawBackup}
            onReset={resetCorruptedData}
          />
        )}

        <TodoInput onAdd={addTodo} />

        <FilterAndSearch
          filter={filter}
          onFilterChange={setFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalFiltered={filteredTasks.length}
        />

        <TodoList
          tasks={filteredTasks}
          totalAllCount={tasks.length}
          filter={filter}
          searchQuery={searchQuery}
          lastAddedHidden={lastAddedHidden}
          onClearLastAddedHidden={clearLastAddedHidden}
          onResetFilter={() => setFilter('all')}
          onClearSearch={() => setSearchQuery('')}
          onToggle={toggleTodo}
          onUpdate={updateTodoText}
          onDelete={deleteTodo}
          onFocusInput={handleFocusInput}
        />

        <Footer
          remainingCount={stats.remaining}
          completedCount={stats.completed}
          storageError={storageError}
          onClearCompletedClick={handleOpenConfirm}
          onRetrySave={retrySave}
        />
      </div>

      {undoItem && (
        <UndoToast onUndo={undoDelete} onDismiss={dismissUndo} />
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        count={stats.completed}
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
        triggerElement={confirmTrigger}
      />
    </main>
  );
};

export default App;
