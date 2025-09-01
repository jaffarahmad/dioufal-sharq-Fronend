import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getAllProjects,
  deleteAllProjects,
  deleteProjectById,
  deleteProjectsByStatus,
  getProjectCountByStatus,
  Project
} from '@/utils/delete-project-data';

export default function DeleteProjectData() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statusCount, setStatusCount] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load current project data
  const loadProjectData = () => {
    const currentProjects = getAllProjects();
    const currentStatusCount = getProjectCountByStatus();
    setProjects(currentProjects);
    setStatusCount(currentStatusCount);
  };

  // Refresh data after any deletion
  const refreshData = () => {
    loadProjectData();
    queryClient.invalidateQueries({ queryKey: ['projects-records'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
  };

  // Delete all projects
  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete ALL project data? This action cannot be undone.')) {
      setIsLoading(true);
      const success = deleteAllProjects();
      if (success) {
        toast({
          title: 'Success',
          description: 'All project data deleted successfully',
        });
        refreshData();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete project data',
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    }
  };

  // Delete projects by status
  const handleDeleteByStatus = async (status: string) => {
    const count = statusCount[status] || 0;
    if (count === 0) {
      toast({
        title: 'No Projects',
        description: `No projects found with status '${status}'`,
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${count} project(s) with status '${status}'?`)) {
      setIsLoading(true);
      const success = deleteProjectsByStatus(status);
      if (success) {
        toast({
          title: 'Success',
          description: `${count} project(s) with status '${status}' deleted successfully`,
        });
        refreshData();
      } else {
        toast({
          title: 'Error',
          description: `Failed to delete projects with status '${status}'`,
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    }
  };

  // Delete specific project
  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (window.confirm(`Are you sure you want to delete project '${projectName}'?`)) {
      setIsLoading(true);
      const success = deleteProjectById(projectId);
      if (success) {
        toast({
          title: 'Success',
          description: `Project '${projectName}' deleted successfully`,
        });
        refreshData();
      } else {
        toast({
          title: 'Error',
          description: `Failed to delete project '${projectName}'`,
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    }
  };

  // Load data on component mount
  React.useEffect(() => {
    loadProjectData();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete Project Data
          </CardTitle>
          <CardDescription>
            Manage and delete project data from localStorage. Use with caution as these actions cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Current Project Data</h3>
              <p className="text-sm text-muted-foreground">
                Total Projects: {projects.length}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadProjectData}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {projects.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Deleting project data will permanently remove it from localStorage. 
                Make sure to backup any important data before proceeding.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {projects.length > 0 && (
        <>
          {/* Delete by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Delete by Status</CardTitle>
              <CardDescription>
                Delete all projects with a specific status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(statusCount).map(([status, count]) => (
                  <Button
                    key={status}
                    variant="outline"
                    className="flex flex-col h-auto p-4"
                    onClick={() => handleDeleteByStatus(status)}
                    disabled={isLoading || count === 0}
                  >
                    <span className="font-medium capitalize">{status}</span>
                    <span className="text-sm text-muted-foreground">{count} projects</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delete Individual Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Delete Individual Projects</CardTitle>
              <CardDescription>
                Delete specific projects one by one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: <span className="capitalize">{project.status}</span>
                        {project.budget && ` • Budget: ${project.budget}`}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delete All */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete all project data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDeleteAll}
                disabled={isLoading}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Projects ({projects.length})
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {projects.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No project data found in localStorage.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}