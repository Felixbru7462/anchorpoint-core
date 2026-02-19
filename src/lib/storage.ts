import { supabase } from './supabase';

export const uploadJobMedia = async (jobId: string, file: File) => {
  // Create a unique file path: job_id/timestamp_filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${jobId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('job-evidence')
    .upload(filePath, file);

  if (error) throw error;

  // Get the public URL to save in the evidence table
  const { data: { publicUrl } } = supabase.storage
    .from('job-evidence')
    .getPublicUrl(filePath);

  return publicUrl;
};