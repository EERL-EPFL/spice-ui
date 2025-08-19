import {
  List,
  Datagrid,
  TextField,
  usePermissions,
  TopToolbar,
  CreateButton,
  ExportButton,
  DateField,
  NumberField,
  ReferenceField,
  FunctionField,
  useAuthProvider,
} from "react-admin";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import { Download, Visibility, Close } from "@mui/icons-material";
import { useState } from "react";
import { postFilters } from "../filters/list";

// Download function for individual assets
const downloadAsset = async (record: any, authProvider: any) => {
  try {
    const token = await authProvider.getToken();
    const response = await fetch(`/api/assets/${record.id}/download`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = record.original_filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      console.error("Failed to download asset");
    }
  } catch (error) {
    console.error("Error during download:", error);
  }
};

// Image viewer modal component
const ImageViewer = ({
  record,
  open,
  onClose,
}: {
  record: any;
  open: boolean;
  onClose: () => void;
}) => {
  if (!record || !open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {record.original_filename}
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <img
          src={`/api/assets/${record.id}/view`}
          alt={record.original_filename}
          style={{
            width: "100%",
            height: "auto",
            maxHeight: "80vh",
            objectFit: "contain",
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

// Download button component
const DownloadButton = ({ record }: { record: any }) => {
  const authProvider = useAuthProvider();

  return (
    <Button
      size="small"
      startIcon={<Download />}
      onClick={() => downloadAsset(record, authProvider)}
    >
      Download
    </Button>
  );
};

// View button component for images
const ViewButton = ({
  record,
  onView,
}: {
  record: any;
  onView: (record: any) => void;
}) => {
  const isImage = record.type === "image";

  if (!isImage) return null;

  return (
    <Button
      size="small"
      startIcon={<Visibility />}
      onClick={() => onView(record)}
    >
      View
    </Button>
  );
};

const ListComponentActions = () => {
  const { permissions } = usePermissions();
  return (
    <TopToolbar>
      {permissions === "admin" && (
        <>
          <CreateButton />
        </>
      )}
      <ExportButton />
    </TopToolbar>
  );
};

export const ListComponent = () => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleView = (record: any) => {
    setSelectedRecord(record);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedRecord(null);
  };

  return (
    <>
      <List
        actions={<ListComponentActions />}
        storeKey={false}
        filters={postFilters}
      >
        <Datagrid rowClick="show">
          <DateField source="uploaded_at" label="Uploaded at" showTime />
          <TextField source="original_filename" />
          <ReferenceField
            source="experiment_id"
            reference="experiments"
            link="show"
          >
            <TextField source="name" />
          </ReferenceField>
          <TextField source="type" />
          <FunctionField
            source="size_bytes"
            label="Size (MB)"
            render={(record) => (record.size_bytes / 1024 / 1024).toFixed(2)}
          />
          <FunctionField
            label="Actions"
            render={(record) => (
              <div style={{ display: "flex", gap: "8px" }}>
                <DownloadButton record={record} />
                <ViewButton record={record} onView={handleView} />
              </div>
            )}
          />
        </Datagrid>
      </List>
      <ImageViewer
        record={selectedRecord}
        open={viewerOpen}
        onClose={handleCloseViewer}
      />
    </>
  );
};

export default ListComponent;
