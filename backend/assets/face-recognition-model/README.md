# Security login face verification models

These detector, landmark, and face descriptor weights are bundled so backend
login never fetches model files from a third-party host at runtime. The model
files were sourced from the `model/` directory of
[vladmandic/face-api](https://github.com/vladmandic/face-api/tree/master/model)
on 18 November 2026. The upstream project documents its face recognition
network as producing 128-value descriptors for one-to-one face comparison.

Do not add selfies or other guard photos here. The only persistent photo used
by the verifier is the guard profile photo already stored by the application.
