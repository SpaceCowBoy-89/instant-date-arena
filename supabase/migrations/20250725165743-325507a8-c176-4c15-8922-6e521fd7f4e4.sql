CREATE OR REPLACE FUNCTION append_message(chat_id_param uuid, message_param jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, ensure the user sending the message is a member of the chat
  IF NOT EXISTS (
    SELECT 1 FROM public.chats
    WHERE chat_id = chat_id_param AND (user1_id = auth.uid() OR user2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'User % is not a member of chat %', auth.uid(), chat_id_param;
  END IF;

  -- Atomically append the new message to the 'temporary_messages' array
  UPDATE public.chats
  SET
    temporary_messages = temporary_messages || message_param,
    updated_at = now()
  WHERE
    chat_id = chat_id_param;
END;
$$;