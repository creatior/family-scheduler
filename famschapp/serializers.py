from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Family, Event, Invitation

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'birth_date']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'phone', 'birth_date']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            phone=validated_data.get('phone', ''),
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