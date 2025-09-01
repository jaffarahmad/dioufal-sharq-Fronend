/**
 * Utility functions to delete project data from localStorage
 */

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  type?: string;
  budget?: string;
  dueDate?: string;
  progress?: number;
}

/**
 * Get all projects from localStorage
 */
export const getAllProjects = (): Project[] => {
  try {
    const storedData = localStorage.getItem('projects-records');
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error('Error loading projects from localStorage:', error);
    return [];
  }
};

/**
 * Delete all project data from localStorage
 */
export const deleteAllProjects = (): boolean => {
  try {
    localStorage.removeItem('projects-records');
    console.log('✅ All project data deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to delete all project data:', error);
    return false;
  }
};

/**
 * Delete a specific project by ID
 */
export const deleteProjectById = (projectId: string): boolean => {
  try {
    const storedData = localStorage.getItem('projects-records');
    const existingRecords = storedData ? JSON.parse(storedData) : [];
    const updatedRecords = existingRecords.filter((record: Project) => record.id !== projectId);
    localStorage.setItem('projects-records', JSON.stringify(updatedRecords));
    console.log(`✅ Project with ID ${projectId} deleted successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete project with ID ${projectId}:`, error);
    return false;
  }
};

/**
 * Delete multiple projects by their IDs
 */
export const deleteProjectsByIds = (projectIds: string[]): boolean => {
  try {
    const storedData = localStorage.getItem('projects-records');
    const existingRecords = storedData ? JSON.parse(storedData) : [];
    const updatedRecords = existingRecords.filter((record: Project) => !projectIds.includes(record.id));
    localStorage.setItem('projects-records', JSON.stringify(updatedRecords));
    console.log(`✅ ${projectIds.length} projects deleted successfully`);
    return true;
  } catch (error) {
    console.error('❌ Failed to delete multiple projects:', error);
    return false;
  }
};

/**
 * Delete projects by status (e.g., 'completed', 'cancelled')
 */
export const deleteProjectsByStatus = (status: string): boolean => {
  try {
    const storedData = localStorage.getItem('projects-records');
    const existingRecords = storedData ? JSON.parse(storedData) : [];
    const updatedRecords = existingRecords.filter((record: Project) => record.status !== status);
    const deletedCount = existingRecords.length - updatedRecords.length;
    localStorage.setItem('projects-records', JSON.stringify(updatedRecords));
    console.log(`✅ ${deletedCount} projects with status '${status}' deleted successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete projects with status '${status}':`, error);
    return false;
  }
};

/**
 * Get project count by status
 */
export const getProjectCountByStatus = (): Record<string, number> => {
  const projects = getAllProjects();
  const statusCount: Record<string, number> = {};
  
  projects.forEach(project => {
    const status = project.status || 'unknown';
    statusCount[status] = (statusCount[status] || 0) + 1;
  });
  
  return statusCount;
};

/**
 * Console helper to show current project data
 */
export const showProjectData = (): void => {
  const projects = getAllProjects();
  const statusCount = getProjectCountByStatus();
  
  console.log('📊 Current Project Data:');
  console.log(`Total Projects: ${projects.length}`);
  console.log('Status Breakdown:', statusCount);
  console.log('Projects:', projects);
};

// Browser console helpers - these will be available in the browser console
if (typeof window !== 'undefined') {
  (window as any).projectUtils = {
    showData: showProjectData,
    deleteAll: deleteAllProjects,
    deleteById: deleteProjectById,
    deleteByIds: deleteProjectsByIds,
    deleteByStatus: deleteProjectsByStatus,
    getAll: getAllProjects,
    getStatusCount: getProjectCountByStatus
  };
  
  console.log('🔧 Project utilities loaded! Use window.projectUtils in console:');
  console.log('- projectUtils.showData() - Show current project data');
  console.log('- projectUtils.deleteAll() - Delete all projects');
  console.log('- projectUtils.deleteById("id") - Delete specific project');
  console.log('- projectUtils.deleteByStatus("completed") - Delete by status');
}