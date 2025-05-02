from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Family, Event, Invitation
from rest_framework.validators import UniqueValidator

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'birth_date']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    username = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'birth_date']
        extra_kwargs = {
            'username': {
                'validators': [UniqueValidator(queryset=User.objects.all())]
            },
            'email': {
                'validators': [UniqueValidator(queryset=User.objects.all())]
            }
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            birth_date=validated_data.get('birth_date', None)
        )
        return user
    
class FamilySerializer(serializers.ModelSerializer):
    class Meta:
        model = Family
        fields = ['id', 'name']

class EventSerializer(serializers.ModelSerializer):
    family = FamilySerializer(read_only=True)
    creator = UserSerializer(read_only=True)
    
    class Meta:
        model = Event
        fields = '__all__'
        extra_kwargs = {
            'creator': {'read_only': True},
            'family': {'required': False}
        }

class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = '__all__'