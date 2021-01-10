import { defineModule } from 'zoov';

const UploadModule = defineModule()
  .model({})
  .methods(() => ({
    upload: async (setLoading) => {
      setLoading(true);
      // await something
      setLoading(false);
      // return url
    },
  }));

const StudentModule = defineModule({ include: { uploadModule: UploadModule } })
  .model({ isLoading: false, avatar: '' })
  .actions({
    setLoading: (draft, value) => (draft.isLoading = value),
    setAvatar: (draft, value) => (draft.avatar = value),
  })
  .methods(({ getActions, uploadModule }) => ({
    uploadAvatar: async () => {
      const url = await uploadModule.getActions().upload(getActions().setLoading);
      getActions().setAvatar(url);
    },
  }));

// if a module instance is not specified when init, zoov will create a new one silently
const studentModule = StudentModule.init({ include: { uploadModule } });
